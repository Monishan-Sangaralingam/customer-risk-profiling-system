package com.fraud.transaction_service.platform;
import jakarta.persistence.*;
import java.time.Instant;
import lombok.Getter;
import lombok.Setter;
@Entity @Table(name="app_sessions", indexes=@Index(name="session_user_idx",columnList="accountId")) @Getter @Setter
public class UserSession {
    @Id @Column(length=64) private String tokenHash;
    @Column(nullable=false) private Long accountId;
    @Column(nullable=false) private Instant expiresAt;
}
