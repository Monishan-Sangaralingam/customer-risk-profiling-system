package com.fraud.transaction_service;

import com.fraud.transaction_service.Channel.Channel;
import com.fraud.transaction_service.Channel.TransactionStatus;
import com.fraud.transaction_service.entity.Transaction;
import com.fraud.transaction_service.repository.TransactionRepository;
import com.fraud.transaction_service.repository.CustomerAggDailyRepository;
import com.fraud.transaction_service.service.DailyAggregationService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.*;

/** Run against a disposable PostgreSQL database, never a demo/production database. */
@EnabledIfEnvironmentVariable(named = "TEST_POSTGRES_URL", matches = ".+")
@SpringBootTest(properties = {
        "spring.datasource.url=${TEST_POSTGRES_URL}",
        "spring.datasource.username=${TEST_POSTGRES_USER:rendercheck}",
        "spring.datasource.password=${TEST_POSTGRES_PASSWORD:}",
        "spring.datasource.driver-class-name=org.postgresql.Driver",
        "spring.jpa.hibernate.ddl-auto=create-drop",
        "spring.jpa.show-sql=false"
})
@Transactional
class RenderPostgresIntegrationTests {
    @Autowired TransactionRepository transactions;
    @Autowired CustomerAggDailyRepository daily;
    @Autowired DailyAggregationService aggregation;

    @Test
    void postgresAggregationsPreserveAliasesNightCountsAndPeakHours() {
        LocalDate day = LocalDate.of(2026, 10, 25);
        save(day, 23, "100.00", TransactionStatus.APPROVED);
        save(day, 23, "300.00", TransactionStatus.DECLINED);
        save(day, 12, "200.00", TransactionStatus.APPROVED);
        // End of range is exclusive.
        save(day.plusDays(1), 1, "999.00", TransactionStatus.APPROVED);
        transactions.flush();

        var rows = transactions.aggregateDaily(day.atStartOfDay(), day.plusDays(1).atStartOfDay());
        assertEquals(1, rows.size());
        var row = rows.get(0);
        assertEquals(999001L, row.getCustomerId());
        assertEquals(3L, row.getTxCount());
        assertEquals(2L, row.getNightCount());
        assertEquals(2L, row.getHourlyPeakCount());
        assertEquals(1L, row.getDeclineCount());
        assertEquals(3L, row.getRiskyMerchantCount());
        assertEquals(0, new BigDecimal("600.00").compareTo(row.getTotalAmount()));
        assertNotNull(row.getStdTxnAmount());

        aggregation.aggregateDay(day);
        var persisted = daily.findByCustomerIdAndAggDate(999001L, day).orElseThrow();
        assertEquals(3L, persisted.getTxCount());
        assertEquals(2L, persisted.getHourlyPeakCount());

        var rolled = daily.rollupRange(day.atStartOfDay(), day.plusDays(1).atStartOfDay());
        assertEquals(1, rolled.size());
        assertEquals(999001L, rolled.get(0).getCustomerId());
        assertEquals(3L, rolled.get(0).getTxCount());
    }

    private void save(LocalDate day, int hour, String amount, TransactionStatus status) {
        transactions.save(Transaction.builder().customerId(999001L)
                .transactionDatetime(day.atTime(hour, 15)).amount(new BigDecimal(amount))
                .currency("LKR").channel(Channel.ECOM).transactionStatus(status)
                .merchantCode("DEMO-CRYPTO").deviceCode("DEMO-DEVICE").location("LK").build());
    }
}
