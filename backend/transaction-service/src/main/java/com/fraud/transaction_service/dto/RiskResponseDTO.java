package com.fraud.transaction_service.dto;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.List;

/** HTTP response contract; the transaction service builds independently. */
@Getter
@Setter
@NoArgsConstructor
public class RiskResponseDTO {
    private Long customerId;
    private Integer score;
    private String category;
    private LocalDateTime calculatedAt;
    private List<String> reasons;
}
