package com.fraud.transaction_service.platform;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

@RestController @RequestMapping("/api/auth") @RequiredArgsConstructor
public class AuthController {
    private final AuthService auth;
    public record Registration(@NotBlank @Size(min=2,max=80) String name,@NotBlank @Email @Size(max=254) String email,@NotBlank @Size(min=12,max=128) String password) {
        @Override public String toString() { return "Registration[credentials=REDACTED]"; }
    }
    public record Login(@NotBlank @Email @Size(max=254) String email,@NotBlank @Size(max=128) String password) {
        @Override public String toString() { return "Login[credentials=REDACTED]"; }
    }
    public record PasswordChange(@NotBlank @Size(max=128) String currentPassword,@NotBlank @Size(min=12,max=128) String newPassword) {
        @Override public String toString() { return "PasswordChange[credentials=REDACTED]"; }
    }
    @PostMapping("/register") @ResponseStatus(HttpStatus.CREATED)
    public AuthService.LoginResult register(@Valid @RequestBody Registration body) { return auth.register(body.name(),body.email(),body.password()); }
    @PostMapping("/login")
    public AuthService.LoginResult login(@Valid @RequestBody Login body) { return auth.login(body.email(),body.password()); }
    @GetMapping("/me")
    public AuthService.Profile me(@RequestHeader("Authorization") String token) { return auth.profile(auth.authenticate(token)); }
    @PostMapping("/logout") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(@RequestHeader("Authorization") String token) { auth.logout(token); }
    @PutMapping("/password") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void password(@RequestHeader("Authorization") String token,@Valid @RequestBody PasswordChange body) { auth.changePassword(token,body.currentPassword(),body.newPassword()); }
}
