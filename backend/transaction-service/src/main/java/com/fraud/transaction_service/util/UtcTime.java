package com.fraud.transaction_service.util;

import java.time.*;
import java.time.format.DateTimeParseException;

/** Database LocalDateTime columns contain UTC, never the server's local timezone. */
public final class UtcTime {
    private UtcTime() {}
    public static LocalDateTime now() { return LocalDateTime.now(ZoneOffset.UTC); }
    public static LocalDateTime parse(String value) {
        if (value == null || value.isBlank()) throw new IllegalArgumentException("Transaction datetime is required");
        try { return OffsetDateTime.parse(value).withOffsetSameInstant(ZoneOffset.UTC).toLocalDateTime(); }
        catch (DateTimeParseException ignored) {
            try { return LocalDateTime.parse(value); }
            catch (DateTimeParseException invalid) { throw new IllegalArgumentException("Invalid ISO 8601 transaction datetime",invalid); }
        }
    }
}
