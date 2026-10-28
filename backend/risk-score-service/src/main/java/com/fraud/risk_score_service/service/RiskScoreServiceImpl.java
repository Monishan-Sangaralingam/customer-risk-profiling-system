package com.fraud.risk_score_service.service;

import com.fraud.risk_score_service.calculater.RiskCategoryCalculator;
import com.fraud.risk_score_service.calculater.RiskChangeDetector;
import com.fraud.risk_score_service.client.MlServiceClient;
import com.fraud.risk_score_service.client.TransactionServiceClient;
import com.fraud.risk_score_service.entity.RiskHistory;
import com.fraud.risk_score_service.entity.RiskScore;
import com.fraud.risk_score_service.exception.ResourceNotFoundException;
import com.fraud.risk_score_service.repository.*;
import com.fraud.risk_score_service.dto.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@RequiredArgsConstructor
@Service
public class RiskScoreServiceImpl implements RiskScoreService {

    private final TransactionServiceClient transactionServiceClient;
    private final MlServiceClient mlServiceClient;

    private final RiskScoreRepository riskScoreRepository;
    private final RiskHistoryRepository riskHistoryRepository;

    private final RiskCategoryCalculator riskCategoryCalculator;
    private final RiskChangeDetector riskChangeDetector;

    private final ObjectMapper objectMapper = new ObjectMapper();//Convert Java objects → JSON

    private String toJsonSafe(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return null;
        }
    }

    private List<String> buildReasons(FeatureDTO features, int score) {
        List<String> reasons = new ArrayList<>();

        if (features.getSpendVelocity7dVsPrev7d() != null &&
                features.getSpendVelocity7dVsPrev7d() > 3.0) {
            reasons.add("Unusually fast spending");
        }

        if (features.getRiskyMerchantCount30d() != null &&
                features.getRiskyMerchantCount30d() > 0) {
            reasons.add("Risky merchant activity found");
        }

        if (Boolean.TRUE.equals(features.getNewDeviceFlagRecent())) {
            reasons.add("New device used recently");
        }

        if (Boolean.TRUE.equals(features.getNewCountryFlagRecent())) {
            reasons.add("New country activity detected");
        }

        return reasons;
    }

    @Override
    public RiskResponseDTO calculateNow(Long customerId, String trigger){
        var settings=transactionServiceClient.getSettings();
        FeatureDTO features = transactionServiceClient.getFeatures(customerId);

        if(features == null){
            throw new ResourceNotFoundException("No features found for customer " + customerId);
        }

        //ML part. (that feature sends to ml service and gets score)
        MlServiceClient.MlPredictResponse ml = null;
        try {
            ml = mlServiceClient.predict(features);
            if (ml == null || ml.risk_score() == null || !Double.isFinite(ml.risk_score())
                    || ml.risk_score() < 0 || ml.risk_score() > 100 || ml.error() != null) {
                throw new IllegalStateException("ML prediction is unavailable or invalid");
            }
        } catch (Exception e) {
            if(!settings.fallbackEnabled()) throw new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE,"ML service unavailable and fallback is disabled");
            int calculatedScore = 20;
            if (features.getSpendVelocity7dVsPrev7d() != null && features.getSpendVelocity7dVsPrev7d() > 2.0) {
                calculatedScore += 30;
            }
            if (features.getRiskyMerchantCount30d() != null && features.getRiskyMerchantCount30d() > 0) {
                calculatedScore += 25;
            }
            if (Boolean.TRUE.equals(features.getNewDeviceFlagRecent())) {
                calculatedScore += 15;
            }
            if (Boolean.TRUE.equals(features.getNewCountryFlagRecent())) {
                calculatedScore += 20;
            }
            if (features.getMaxTxnAmount30d() != null && features.getMaxTxnAmount30d().doubleValue() > 5000) {
                calculatedScore += 15;
            }
            calculatedScore = Math.min(100, Math.max(0, calculatedScore));
            String cat = riskCategoryCalculator.categoryFromScore(calculatedScore);
            ml = new MlServiceClient.MlPredictResponse((double) calculatedScore, cat, null);
        }

        // assuming ML returns risk_score (0–100)
        int score = (int) Math.round(ml.risk_score());

        String category = riskCategoryCalculator.categoryFromScore(score,settings.mediumThreshold(),settings.highThreshold());

        //Read previous score (Optional)
        Optional<RiskScore> previous = riskScoreRepository.findByCustomerId(customerId);

        /*Integer preScore = previous.map(RiskScore::getScore).orElse(null);
        String preCategory = previous.map(RiskScore::getCategory).orElse(null);

        boolean movedUp = previous
                .map(oldRisk-> riskChangeDetector.movedUp(oldRisk.getCategory(), category))
                .orElse(false);*/

        Integer preScore = null;
        String preCategory = null;
        boolean movedUp = false;

        if (previous.isPresent()) {
            RiskScore old = previous.get();

            preScore = old.getScore();
            preCategory = old.getCategory();
            movedUp = riskChangeDetector.movedUp(preCategory, category);
        }

        // Save current score (update or create)
        RiskScore current = previous.orElseGet(RiskScore::new); //If previous has a RiskScore → use it. If previous is empty → create a NEW RiskScore object.
        if (current.getCustomerId() == null) { // only for newly created
            current.setCustomerId(customerId);
        }
        current.setScore(score);
        current.setCategory(category);
        current.setUpdatedAt(LocalDateTime.now());

        riskScoreRepository.save(current);

        //Build reasons
        List<String> reasons = buildReasons(features,score);

        //save history entry
        RiskHistory history = new RiskHistory();
        history.setCustomerId(customerId);
        history.setScore(score);
        history.setCategory(category);
        history.setPreviousScore(preScore);
        history.setPreviousCategory(preCategory);
        history.setCalculatedAt(LocalDateTime.now());

        history.setTrigger_type(trigger == null ? "TRANSACTION" : trigger);
        history.setAlertTriggered(movedUp);
        history.setFeatureSnapshotJson(toJsonSafe(features));
        history.setReasonsJson(toJsonSafe(reasons));

        riskHistoryRepository.save(history);

        RiskResponseDTO response = new RiskResponseDTO();
        response.setCustomerId(customerId);
        response.setScore(score);
        response.setCategory(category);
        response.setCalculatedAt(history.getCalculatedAt());
        response.setReasons(reasons);
        response.setTriggerType(history.getTrigger_type());

        return response;

    }


    @Override
    public RiskResponseDTO getCurrent(Long customerId) {

        RiskScore rs = riskScoreRepository.findByCustomerId(customerId)
                .orElseThrow(() ->
                        new ResourceNotFoundException("No current risk score for customer " + customerId));

        return RiskResponseDTO.builder()
                .customerId(rs.getCustomerId())
                .score(rs.getScore())
                .category(rs.getCategory())
                .calculatedAt(rs.getUpdatedAt())
                .reasons(riskHistoryRepository.findTop30ByCustomerIdOrderByCalculatedAtDesc(customerId).stream().findFirst().map(h->readReasons(h.getReasonsJson())).orElse(List.of()))
                .build();
    }

    @Override
    public List<RiskResponseDTO> getHistory(Long customerId) {
        List<RiskHistory> list = riskHistoryRepository.findTop30ByCustomerIdOrderByCalculatedAtDesc(customerId);

        List<RiskResponseDTO> out = new ArrayList<>();
        for (RiskHistory h : list) {
            out.add(RiskResponseDTO.builder()
                    .customerId(h.getCustomerId())
                    .score(h.getScore())
                    .category(h.getCategory())
                    .calculatedAt(h.getCalculatedAt())
                    .triggerType(h.getTrigger_type())
                    .reasons(readReasons(h.getReasonsJson()))
                    .build());
        }
        return out;
    }

    @Override
    public List<RiskScore> getAll() {
        return riskScoreRepository.findAll();
    }

    private List<String> readReasons(String json) {
        if(json==null)return List.of();
        try { return objectMapper.readValue(json,new com.fasterxml.jackson.core.type.TypeReference<List<String>>(){}); }
        catch(Exception e) { return List.of(); }
    }
}
