package com.fraud.risk_score_service.calculater;

import org.springframework.stereotype.Component;

@Component
public class RiskChangeDetector {

    public boolean movedUp(String prev, String next) {
        return rank(next) > rank(prev);
    }

    private int rank(String c) {
        if(c==null)return 0;
        return switch (c.toUpperCase(java.util.Locale.ROOT)) {
            case "LOW" -> 1;
            case "MEDIUM" -> 2;
            case "HIGH" -> 3;
            default -> 0;
        };
    }

}
