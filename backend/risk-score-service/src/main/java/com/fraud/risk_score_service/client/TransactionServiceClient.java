package com.fraud.risk_score_service.client;

import com.fraud.risk_score_service.dto.FeatureDTO;
import lombok.Getter;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import java.util.Map;

//Risk Score Service → can call Transaction Service like a normal method
@FeignClient(name = "transaction-service", url ="${clients.transaction-service}")
public interface TransactionServiceClient {

    @GetMapping("/features/{customerId}")
    FeatureDTO getFeatures(@PathVariable("customerId") Long customerId);

    @GetMapping("/api/auth/me")
    Map<String,Object> verifySession(@RequestHeader("Authorization") String token);

    record Settings(int mediumThreshold,int highThreshold,boolean fallbackEnabled) {}
    @GetMapping("/api/settings") Settings getSettings();
}
