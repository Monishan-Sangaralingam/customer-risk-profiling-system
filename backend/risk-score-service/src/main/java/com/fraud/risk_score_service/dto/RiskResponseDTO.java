package com.fraud.risk_score_service.dto;

import lombok.*;

import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RiskResponseDTO {

    private Long customerId;
    private Integer score;             // 0-100
    private String category;           // LOW/MEDIUM/HIGH
    private LocalDateTime calculatedAt;

    private List<String> reasons;
    private String triggerType;

}
