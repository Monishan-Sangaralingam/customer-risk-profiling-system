package com.fraud.risk_score_service.controller;
import com.fraud.risk_score_service.client.MlServiceClient;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
import java.util.Map;
@RestController @RequestMapping("/api/risk/system") @RequiredArgsConstructor
public class ModelStatusController {
    private final MlServiceClient ml;
    @GetMapping("/status") public Map<String,Object> status() {
        try { return ml.health(); }
        catch(Exception e) { return Map.of("status","DOWN","model_loaded",false); }
    }
}
