package com.fraud.risk_score_service.calculater;

import org.springframework.stereotype.Component;

@Component
public class RiskCategoryCalculator {

    public String categoryFromScore(int score){
        return categoryFromScore(score,40,70);
    }

    public String categoryFromScore(int score,int mediumThreshold,int highThreshold){
        if(score>=highThreshold) return "High";
        if(score>=mediumThreshold) return "Medium";
        return "Low";
    }
}
