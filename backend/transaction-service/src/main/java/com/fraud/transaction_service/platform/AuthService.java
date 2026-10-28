package com.fraud.transaction_service.platform;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service @RequiredArgsConstructor
public class AuthService {
    private final UserAccountRepository accounts;
    private final UserSessionRepository sessions;
    private static final String UNKNOWN_USER_HASH=PasswordHasher.hash("No account matches this placeholder");
    public record Profile(Long id,String name,String email,String role) {}
    public record LoginResult(String token,Instant expiresAt,Profile user) {
        @Override public String toString() { return "LoginResult[token=REDACTED, expiresAt="+expiresAt+", user="+user+"]"; }
    }
    public Profile profile(UserAccount user) { return new Profile(user.getId(),user.getName(),user.getEmail(),"Fraud Risk Analyst"); }
    @Transactional
    public LoginResult register(String name,String email,String password) {
        email=email.trim().toLowerCase(Locale.ROOT);
        if(accounts.findByEmail(email).isPresent()) throw new ResponseStatusException(HttpStatus.CONFLICT,"An account with this email already exists");
        UserAccount user=new UserAccount(); user.setName(name.trim());user.setEmail(email);user.setPasswordHash(PasswordHasher.hash(password));
        return startSession(accounts.saveAndFlush(user));
    }
    @Transactional
    public LoginResult login(String email,String password) {
        UserAccount user=accounts.findByEmail(email.trim().toLowerCase(Locale.ROOT)).orElse(null);
        // Also derive a password for unknown users to avoid a fast user-existence check.
        boolean matches=PasswordHasher.matches(password,user==null?UNKNOWN_USER_HASH:user.getPasswordHash());
        boolean valid=user!=null && matches;
        if(!valid) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Email or password is incorrect");
        return startSession(user);
    }
    private LoginResult startSession(UserAccount user) {
        byte[] bytes=new byte[32];new SecureRandom().nextBytes(bytes);
        String token=Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        UserSession session=new UserSession(); session.setTokenHash(PasswordHasher.tokenHash(token));session.setAccountId(user.getId());session.setExpiresAt(Instant.now().plus(12,ChronoUnit.HOURS));sessions.save(session);
        return new LoginResult(token,session.getExpiresAt(),profile(user));
    }
    public UserAccount authenticate(String authorization) {
        String token=bearer(authorization);
        UserSession session=sessions.findById(PasswordHasher.tokenHash(token)).filter(s->s.getExpiresAt().isAfter(Instant.now()))
            .orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Session expired. Please sign in again."));
        return accounts.findById(session.getAccountId()).orElseThrow(()->new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Account unavailable"));
    }
    public static String bearer(String authorization) {
        if(authorization==null || !authorization.startsWith("Bearer ") || authorization.length()>256) throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"Please sign in");
        return authorization.substring(7);
    }
    public void logout(String authorization) { sessions.deleteById(PasswordHasher.tokenHash(bearer(authorization))); }
    @Transactional
    public void changePassword(String authorization,String currentPassword,String newPassword) {
        UserAccount user=authenticate(authorization);
        if(!PasswordHasher.matches(currentPassword,user.getPasswordHash())) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Current password is incorrect");
        user.setPasswordHash(PasswordHasher.hash(newPassword));accounts.save(user);sessions.deleteByAccountId(user.getId());
    }
}
