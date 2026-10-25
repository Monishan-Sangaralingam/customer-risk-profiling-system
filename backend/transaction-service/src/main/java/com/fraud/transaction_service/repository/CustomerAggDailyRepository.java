package com.fraud.transaction_service.repository;

import com.fraud.transaction_service.dto.DailyAggregationDTO;
import com.fraud.transaction_service.dto.WeeklyAggregationDTO;
import com.fraud.transaction_service.entity.CustomerAggDaily;
import org.springframework.data.repository.query.Param;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.List;

@Repository
public interface CustomerAggDailyRepository extends JpaRepository<CustomerAggDaily,Long> {

    //here we dont need to create a query. it automatically creates it. because customerId and aggDate are in entity.
    Optional<CustomerAggDaily> findByCustomerIdAndAggDate(Long customerId, LocalDate aggDate);

    //Spring does NOT know. What is "DateRange"? So it cannot auto-generate SQL. You could write.
    @Query("""
    SELECT d FROM CustomerAggDaily d
    WHERE d.aggDate >= :start AND d.aggDate < :end
""")
    List<CustomerAggDaily> findAllByDateRange(@org.springframework.data.repository.query.Param("start") LocalDate start,
                                              @org.springframework.data.repository.query.Param("end") LocalDate end);

    /*@Query(value = """
SELECT
  t.customer_id AS "customerId",
  SUM(t.amount) AS "totalAmount",
  COUNT(*) AS "txCount",
  SUM(CASE WHEN t.transaction_status = 'DECLINED' THEN 1 ELSE 0 END) AS "declineCount",
  SUM(CASE WHEN t.channel = 'ECOM' THEN 1 ELSE 0 END) AS "ecomCount",
  SUM(CASE WHEN t.channel = 'POS'  THEN 1 ELSE 0 END) AS "posCount",
  SUM(CASE WHEN t.channel = 'ATM'  THEN 1 ELSE 0 END) AS "atmCount",
  SUM(CASE WHEN EXTRACT(HOUR FROM t.transaction_datetime) >= 22 OR EXTRACT(HOUR FROM t.transaction_datetime) < 5 THEN 1 ELSE 0 END) AS "nightCount",

  COALESCE(MAX(h.peak_count), 0) AS "hourlyPeakCount",

  MAX(t.amount) AS "maxTxnAmount",
  AVG(t.amount) AS "avgTxnAmount",
  COALESCE(STDDEV_POP(t.amount), 0) AS "stdTxnAmount",
  COUNT(DISTINCT t.device_code)   AS "uniqueDeviceCount",
  COUNT(DISTINCT t.location)      AS "uniqueCountryCount",
  0                               AS "uniqueIpCount",
  COUNT(DISTINCT t.merchant_code) AS "uniqueMerchantCount",
  0                               AS "riskyMerchantCount"
FROM transactions t

LEFT JOIN (
  SELECT customer_id, MAX(cnt) AS peak_count
  FROM (
    SELECT customer_id, EXTRACT(HOUR FROM transaction_datetime) AS hr, COUNT(*) AS cnt
    FROM transactions
    WHERE transaction_datetime >= :start
      AND transaction_datetime <  :end
    GROUP BY customer_id, EXTRACT(HOUR FROM transaction_datetime)
  ) z
  GROUP BY customer_id
) h ON h.customer_id = t.customer_id

WHERE t.transaction_datetime >= :start
  AND t.transaction_datetime <  :end
GROUP BY t.customer_id
""", nativeQuery = true)
    List<DailyAggregationDTO> aggregateDaily(@Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end);*/

    @Query(value = """
SELECT
  t.customer_id AS "customerId",
  SUM(t.amount) AS "totalAmount",
  COUNT(*) AS "txCount",
  SUM(CASE WHEN t.transaction_status = 'DECLINED' THEN 1 ELSE 0 END) AS "declineCount",

  SUM(CASE WHEN t.channel = 'ECOM' THEN 1 ELSE 0 END) AS "ecomCount",
  SUM(CASE WHEN t.channel = 'POS'  THEN 1 ELSE 0 END) AS "posCount",
  SUM(CASE WHEN t.channel = 'ATM'  THEN 1 ELSE 0 END) AS "atmCount",

  SUM(CASE WHEN EXTRACT(HOUR FROM t.transaction_datetime) >= 22 OR EXTRACT(HOUR FROM t.transaction_datetime) < 5 THEN 1 ELSE 0 END) AS "nightCount",

  COALESCE(MAX(h.peak_count), 0) AS "hourlyPeakCount",

  MAX(t.amount) AS "maxTxnAmount",
  AVG(t.amount) AS "avgTxnAmount",
  COALESCE(STDDEV_POP(t.amount), 0) AS "stdTxnAmount",

  COUNT(DISTINCT t.device_code)   AS "uniqueDeviceCount",
  COUNT(DISTINCT t.location)      AS "uniqueCountryCount",
  0                               AS "uniqueIpCount",
  COUNT(DISTINCT t.merchant_code) AS "uniqueMerchantCount",
  0                               AS "riskyMerchantCount"
FROM transactions t

LEFT JOIN (
  SELECT customer_id, MAX(cnt) AS peak_count
  FROM (
    SELECT customer_id, EXTRACT(HOUR FROM transaction_datetime) AS hr, COUNT(*) AS cnt
    FROM transactions
    WHERE transaction_datetime >= :start
      AND transaction_datetime <  :end
    GROUP BY customer_id, EXTRACT(HOUR FROM transaction_datetime)
  ) z
  GROUP BY customer_id
) h ON h.customer_id = t.customer_id

WHERE t.transaction_datetime >= :start
  AND t.transaction_datetime <  :end
GROUP BY t.customer_id
""", nativeQuery = true)
    List<WeeklyAggregationDTO> rollupRange(@Param("start") LocalDateTime start,
                                            @Param("end") LocalDateTime end);

    List<CustomerAggDaily>
    findByCustomerIdAndAggDateBetween(
            Long customerId,
            LocalDate start,
            LocalDate end
    );

}
