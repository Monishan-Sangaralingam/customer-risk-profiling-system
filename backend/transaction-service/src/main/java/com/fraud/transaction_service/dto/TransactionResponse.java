package com.fraud.transaction_service.dto;


import com.fraud.transaction_service.Channel.Channel;
import com.fraud.transaction_service.Channel.TransactionStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class TransactionResponse {

    private Long transactionId;
    private Long customerId;

    private BigDecimal amount;
    private String currency;
    private Channel channel;

    private String merchantCode;
    private String deviceCode;
    private String location;

    private TransactionStatus transactionStatus;
    private String declineReason;

    @com.fasterxml.jackson.annotation.JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime transactionDatetime;
    @com.fasterxml.jackson.annotation.JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime createdAt;

    private Integer riskScore;
    private String riskLevel;

}
