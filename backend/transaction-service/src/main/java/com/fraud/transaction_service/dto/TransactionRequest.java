package com.fraud.transaction_service.dto;

import com.fraud.transaction_service.Channel.Channel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
@Builder
public class TransactionRequest {

    @NotNull(message = "Customer ID is required")
    private Long customerId;

    @NotNull(message = "Amount is required")
    @Positive(message = "Amount must be greater than zero")
    private BigDecimal amount;

    @NotBlank(message = "Currency is required")
    @Size(max = 10)
    private String currency;

    @NotNull(message = "Channel is required")
    private Channel channel;

    @NotBlank(message = "Device code is required")
    private String merchantCode;

    @NotBlank(message = "Location code is required")
    private String deviceCode;

    @NotBlank(message = "Transaction datetime is required")
    private String location;

    @NotNull(message = "Transaction datetime is required")
    private String transactionDatetime;



}
