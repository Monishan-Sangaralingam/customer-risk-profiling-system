package com.fraud.risk_score_service.entity;


import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "risk_scores")
@Getter
@Setter
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class RiskScore {

    @Id
    private Long customerId;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false,length = 20)
    private String category;

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime updatedAt;

}
