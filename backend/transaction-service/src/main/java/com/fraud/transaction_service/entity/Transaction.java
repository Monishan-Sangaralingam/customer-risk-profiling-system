package com.fraud.transaction_service.entity;


import com.fraud.transaction_service.Channel.Channel;
import com.fraud.transaction_service.Channel.TransactionStatus;
import jakarta.persistence.Entity;
import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "transactions",
        indexes = { //“Optimize this table for fast searching by customer and date.”
                @Index(name="idx_customer", columnList="customer_id"),
                @Index(name="idx_datetime", columnList="transaction_datetime")
        }
        )
@Getter
@Setter //Automatically generates: ✔ Getters ✔ Setters ✔ toString() ✔ equals() / hashCode() ✔ Required constructor
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Transaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "transaction_id")
    private Long transactionId;

    @Column(name = "customer_id", nullable = false)
    private Long customerId;   // FK

    @Column(name = "transaction_datetime", nullable = false)
    @com.fasterxml.jackson.annotation.JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime transactionDatetime;

    @Column(name = "amount", nullable = false)
    private BigDecimal amount;     // you can change to BigDecimal later if you want

    @Column(name = "currency", length = 10, nullable = false)
    private String currency;

    @Enumerated(EnumType.STRING)
    @Column(name = "channel", length = 20, nullable = false)
    private Channel channel;    // POS / ATM / ECOM

    @Column(name = "merchant_code")
    private String merchantCode;   // FK

    @Column(name = "device_code")
    private String deviceCode;     // FK

    @Column(name = "location")
    private String location;   // FK

    @Enumerated(EnumType.STRING)
    @Column(name = "transaction_status", nullable = false, length = 30)
    private TransactionStatus transactionStatus;

    @Column(name = "decline_reason", length = 255)
    private String declineReason;

    @Column(name = "created_at")
    @com.fasterxml.jackson.annotation.JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime createdAt;

    private Integer riskScore;
    private String riskLevel;

    @PrePersist  //JPA lifecycle callback.
    public void prePersist() {
        if (createdAt == null) createdAt = com.fraud.transaction_service.util.UtcTime.now();
        if (transactionDatetime == null) transactionDatetime = com.fraud.transaction_service.util.UtcTime.now();
        if (transactionStatus == null) transactionStatus = TransactionStatus.valueOf(String.valueOf(TransactionStatus.PENDING));
    }
}

