package com.fraud.transaction_service;
import com.fraud.transaction_service.platform.PasswordHasher;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;
class PasswordHasherTests {
    @Test void saltedPasswordHashRejectsWrongAndCorruptPasswords() {
        String password="Local-test-password!42";
        String first=PasswordHasher.hash(password),second=PasswordHasher.hash(password);
        assertNotEquals(first,second);assertFalse(first.contains(password));
        assertTrue(PasswordHasher.matches(password,first));
        assertFalse(PasswordHasher.matches("incorrect",first));
        assertFalse(PasswordHasher.matches(password,"corrupt"));
    }
}
