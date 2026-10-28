package com.fraud.transaction_service;

import com.fraud.transaction_service.util.UtcTime;
import java.time.*;
import java.util.TimeZone;
import org.junit.jupiter.api.Test;
import static org.junit.jupiter.api.Assertions.*;

class UtcTimeTests {
    @Test void parsesUtcAndOffsetsWithoutLosingTheInstant() {
        LocalDateTime expected=LocalDateTime.of(2026,10,28,12,0);
        assertEquals(expected,UtcTime.parse("2026-10-28T12:00:00Z"));
        assertEquals(expected,UtcTime.parse("2026-10-28T17:30:00+05:30"));
        assertEquals(expected,UtcTime.parse("2026-10-28T12:00:00"));
        assertThrows(IllegalArgumentException.class,()->UtcTime.parse(null));
        assertThrows(IllegalArgumentException.class,()->UtcTime.parse("invalid"));
    }
    @Test void serverTimezoneDoesNotChangeUtcStorage() {
        TimeZone original=TimeZone.getDefault();
        try {
            TimeZone.setDefault(TimeZone.getTimeZone("Asia/Colombo"));
            Instant before=Instant.now();
            Instant stored=UtcTime.now().toInstant(ZoneOffset.UTC);
            assertFalse(stored.isBefore(before));
            assertFalse(stored.isAfter(Instant.now()));
        } finally { TimeZone.setDefault(original); }
    }
}
