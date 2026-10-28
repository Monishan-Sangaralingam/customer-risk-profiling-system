package com.fraud.risk_score_service.client;

import com.fraud.risk_score_service.dto.FeatureDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.GetMapping;
import java.util.Map;

@FeignClient(name="ml-service", url = "${clients.ml-service}")
public interface MlServiceClient {

    @PostMapping("/predict")
    MlPredictResponse predict(@RequestBody FeatureDTO features);

    @GetMapping("/health") Map<String,Object> health();

    record MlPredictResponse(Double risk_score, String risk_level, String error) {}

}
