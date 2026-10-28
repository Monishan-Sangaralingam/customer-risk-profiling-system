package com.fraud.transaction_service.platform;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
@Entity @Table(name="app_alert_status") @Getter @Setter
public class AlertStatus {
    @Id @Column(length=100) private String id;
    @Column(nullable=false,length=20) private String status;
    @Column(nullable=false,length=100) private String eventKey;
}
