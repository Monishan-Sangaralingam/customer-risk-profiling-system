package com.fraud.risk_score_service.entity;

import com.fasterxml.classmate.AnnotationOverrides;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name="risk_history")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class RiskHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long riskHistoryId;

    @Column(nullable = false)
    private Long customerId;

    @Column(nullable = false)
    private Integer score;

    @Column(nullable = false, length = 16)
    private String category;

    private Integer previousScore;
    private String previousCategory;

    @Column(nullable = false)
    @com.fasterxml.jackson.annotation.JsonFormat(pattern="yyyy-MM-dd'T'HH:mm:ss.SSS'Z'")
    private LocalDateTime calculatedAt;

    @Column(name = "trigger_type", nullable = false, length = 32)
    private String trigger_type; // TRANSACTION/DAILY_BATCH/MANUAL

    private Boolean alertTriggered;

    @Column(columnDefinition = "TEXT")
    private String featureSnapshotJson;

    @Column(columnDefinition = "TEXT")
    private String reasonsJson;

}


