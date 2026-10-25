package com.fraud.transaction_service.repository;

import com.fraud.transaction_service.dto.DailyAggregationDTO;
import com.fraud.transaction_service.entity.Transaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List; //Collection (group) of items
import java.util.Optional;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction,Long> {

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
  SUM(CASE WHEN t.merchant_code LIKE '%CRYPTO%' OR t.merchant_code LIKE '%CASINO%' OR t.merchant_code LIKE '%GAMING%' OR t.merchant_code LIKE '%RISK%' THEN 1 ELSE 0 END) AS "riskyMerchantCount"
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
                                             @Param("end") LocalDateTime end);

    //📌 List = many
    //📌 Optional = zero or one
    //“Query by Method Name”
    List<Transaction> findByCustomerId(Long customerId);
    Optional<Transaction> findByTransactionId(Long transactionId);
    List<Transaction> findByTransactionDatetimeBetween(LocalDateTime start, LocalDateTime end);
    List<Transaction> findByTransactionStatus(String transactionStatus);
}