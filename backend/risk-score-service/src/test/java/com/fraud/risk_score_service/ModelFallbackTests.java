package com.fraud.risk_score_service;
import com.fraud.risk_score_service.calculater.*;
import com.fraud.risk_score_service.client.*;
import com.fraud.risk_score_service.dto.FeatureDTO;
import com.fraud.risk_score_service.repository.*;
import com.fraud.risk_score_service.service.RiskScoreServiceImpl;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class ModelFallbackTests {
    @Test void invalidModelResponseCannotBypassDisabledFallback() {
        var transactions=mock(TransactionServiceClient.class);var ml=mock(MlServiceClient.class);
        var scores=mock(RiskScoreRepository.class);var history=mock(RiskHistoryRepository.class);
        var service=new RiskScoreServiceImpl(transactions,ml,scores,history,new RiskCategoryCalculator(),new RiskChangeDetector());
        when(transactions.getSettings()).thenReturn(new TransactionServiceClient.Settings(40,70,false));
        when(transactions.getFeatures(9L)).thenReturn(new FeatureDTO());
        when(ml.predict(any())).thenReturn(new MlServiceClient.MlPredictResponse(null,null,"Model failed"));
        assertEquals(503,assertThrows(ResponseStatusException.class,()->service.calculateNow(9L,"TEST")).getStatusCode().value());
        verifyNoInteractions(scores,history);
    }
    @Test void mixedCaseCategoriesRecordEscalations() {
        var detector=new RiskChangeDetector();
        assertTrue(detector.movedUp("Low","High"));
        assertFalse(detector.movedUp("High","Medium"));
    }
}
