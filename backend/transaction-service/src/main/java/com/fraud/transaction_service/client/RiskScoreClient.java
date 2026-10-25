package com.fraud.transaction_service.client;

import com.fraud.transaction_service.dto.RiskResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

@FeignClient(
        name = "risk-score-service",
        url = "${clients.risk-score-service}"
)
public interface RiskScoreClient {

    @GetMapping("/risk/calculate/{customerId}")
    RiskResponseDTO calculate(@PathVariable Long customerId);
}
