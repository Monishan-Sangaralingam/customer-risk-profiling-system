package com.fraud.transaction_service.platform;
import org.springframework.data.jpa.repository.JpaRepository;
public interface UserSessionRepository extends JpaRepository<UserSession,String> {
    void deleteByAccountId(Long accountId);
}
