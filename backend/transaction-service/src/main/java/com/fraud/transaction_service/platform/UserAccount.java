package com.fraud.transaction_service.platform;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity @Table(name="app_users") @Getter @Setter
public class UserAccount {
    @Id @GeneratedValue(strategy=GenerationType.IDENTITY) private Long id;
    @Column(nullable=false, unique=true, length=254) private String email;
    @Column(nullable=false, length=80) private String name;
    @Column(nullable=false, length=300) private String passwordHash;
}
