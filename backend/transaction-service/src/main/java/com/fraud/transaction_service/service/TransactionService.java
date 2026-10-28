package com.fraud.transaction_service.service;

import com.fraud.transaction_service.dto.RiskResponseDTO;
import com.fraud.transaction_service.client.RiskScoreClient;
import com.fraud.transaction_service.entity.Transaction;
import com.fraud.transaction_service.Channel.TransactionStatus;
import com.fraud.transaction_service.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import com.fraud.transaction_service.repository.TransactionRepository;
import com.fraud.transaction_service.dto.*;

import java.time.LocalDateTime;
import java.util.List;

@RequiredArgsConstructor
@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;
    private final RiskScoreClient riskScoreClient;

    @Autowired
    private DailyAggregationService dailyAggregationService;

    //Add Risk Score Service
    public TransactionResponse create(TransactionRequest request) {

        try {
            // 1. Build transaction first
            Transaction ts = Transaction.builder()
                    .customerId(request.getCustomerId())
                    .amount(request.getAmount())
                    .currency(request.getCurrency())
                    .channel(request.getChannel())
                    .merchantCode(request.getMerchantCode())
                    .deviceCode(request.getDeviceCode())
                    .location(request.getLocation())
                    .transactionStatus(TransactionStatus.PENDING)
                    .transactionDatetime(request.getTransactionDatetime())
                    .createdAt(LocalDateTime.now())
                    .build();

            // 2. Save transaction first
            Transaction saved = transactionRepository.save(ts);

            dailyAggregationService.aggregateDay(
                    saved.getTransactionDatetime().toLocalDate()
            );

            // 3. Now call risk score service
            RiskResponseDTO risk = riskScoreClient.calculate(saved.getCustomerId());
            saved.setRiskScore(risk.getScore());
            saved.setRiskLevel(risk.getCategory());

            // 4. Decision logic
            if ("High".equalsIgnoreCase(risk.getCategory())) {
                saved.setTransactionStatus(TransactionStatus.DECLINED);
                saved.setDeclineReason("High risk transaction");
            } else {
                saved.setTransactionStatus(TransactionStatus.APPROVED);
                saved.setDeclineReason(null);
            }

            // 5. Save updated transaction
            Transaction updated = transactionRepository.save(saved);

            // 6. Return response
            return TransactionResponse.builder()
                    .transactionId(updated.getTransactionId())
                    .customerId(updated.getCustomerId())
                    .amount(updated.getAmount())
                    .currency(updated.getCurrency())
                    .channel(updated.getChannel())
                    .merchantCode(updated.getMerchantCode())
                    .deviceCode(updated.getDeviceCode())
                    .location(updated.getLocation())
                    .transactionStatus(updated.getTransactionStatus())
                    .declineReason(updated.getDeclineReason())
                    .transactionDatetime(updated.getTransactionDatetime())
                    .createdAt(updated.getCreatedAt())
                    .riskScore(risk.getScore())
                    .riskLevel(risk.getCategory())
                    .build();

        } catch (Exception e) {
            throw new RuntimeException("Transaction failed: " + e.getMessage());
        }
    }

    private TransactionResponse map(Transaction ts){
        return TransactionResponse.builder()
                .transactionId(ts.getTransactionId())
                .customerId(ts.getCustomerId())
                .amount(ts.getAmount())
                .currency(ts.getCurrency())
                .channel(ts.getChannel())
                .merchantCode(ts.getMerchantCode())
                .deviceCode(ts.getDeviceCode())
                .location(ts.getLocation())
                .transactionStatus(ts.getTransactionStatus())
                .declineReason(ts.getDeclineReason())
                .transactionDatetime(ts.getTransactionDatetime())
                .createdAt(ts.getCreatedAt())
                .riskScore(ts.getRiskScore())
                .riskLevel(ts.getRiskLevel())
                .build();

    }

    public List<Transaction> getByCustomerId(Long customerId){
        return transactionRepository.findByCustomerId(customerId);
    }

    public List<TransactionResponse> getApproved(Long customerId){
        return transactionRepository.findByCustomerId(customerId)
                .stream() //Start Reading the List One by One
                .filter(tx -> tx.getTransactionStatus() == TransactionStatus.APPROVED)
                .map(this::map)
                .toList();
    }

    public TransactionResponse getByTransactionId(Long transactionId){
        Transaction ts = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(()-> new ResourceNotFoundException("Transaction not found:" + transactionId));
        return map(ts);
    }

    public TransactionResponse updateStatus(Long transactionId, TransactionStatus status, String declineReason) {
        Transaction tx = transactionRepository.findByTransactionId(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found: " + transactionId));

        tx.setTransactionStatus(status);
        tx.setDeclineReason(declineReason);

        Transaction saved = transactionRepository.save(tx);
        return map(saved);
    }

    public List<TransactionResponse> getAll() {
        return transactionRepository.findAll()
                .stream()
                .sorted((a, b) -> b.getTransactionId().compareTo(a.getTransactionId()))
                .map(this::map)
                .toList();
    }

}
