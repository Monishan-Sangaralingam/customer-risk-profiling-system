package com.fraud.risk_score_service;
import com.fraud.risk_score_service.calculater.RiskCategoryCalculator;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class RiskCategoryCalculatorTests {
    @Test void respectsConfiguredBoundaries() {
        var calculator=new RiskCategoryCalculator();
        assertEquals("Low",calculator.categoryFromScore(19,20,60));
        assertEquals("Medium",calculator.categoryFromScore(20,20,60));
        assertEquals("Medium",calculator.categoryFromScore(59,20,60));
        assertEquals("High",calculator.categoryFromScore(60,20,60));
        assertEquals("High",calculator.categoryFromScore(70));
    }
}
