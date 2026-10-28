package com.fraud.transaction_service;
import com.fraud.transaction_service.platform.*;
import java.time.Instant;
import java.util.Optional;
import org.junit.jupiter.api.Test;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
class AuthServiceTests {
    @Test void expiredSessionsAndFabricatedTokensAreRejected() {
        var accounts=mock(UserAccountRepository.class);var sessions=mock(UserSessionRepository.class);
        var auth=new AuthService(accounts,sessions);
        assertThrows(ResponseStatusException.class,()->auth.authenticate(null));
        assertThrows(ResponseStatusException.class,()->auth.authenticate("Bearer forged"));
        UserSession session=new UserSession();session.setExpiresAt(Instant.now().minusSeconds(1));
        when(sessions.findById(PasswordHasher.tokenHash("expired"))).thenReturn(Optional.of(session));
        assertThrows(ResponseStatusException.class,()->auth.authenticate("Bearer expired"));
        verifyNoInteractions(accounts);
    }
    @Test void changingPasswordRevokesAllSessions() {
        var accounts=mock(UserAccountRepository.class);var sessions=mock(UserSessionRepository.class);
        var auth=new AuthService(accounts,sessions);
        var user=new UserAccount();user.setId(4L);user.setPasswordHash(PasswordHasher.hash("Old-password!123"));
        var session=new UserSession();session.setExpiresAt(Instant.now().plusSeconds(100));session.setAccountId(4L);
        when(sessions.findById(PasswordHasher.tokenHash("valid"))).thenReturn(Optional.of(session));
        when(accounts.findById(4L)).thenReturn(Optional.of(user));
        auth.changePassword("Bearer valid","Old-password!123","New-password!456");
        assertTrue(PasswordHasher.matches("New-password!456",user.getPasswordHash()));
        verify(sessions).deleteByAccountId(4L);
    }
}
