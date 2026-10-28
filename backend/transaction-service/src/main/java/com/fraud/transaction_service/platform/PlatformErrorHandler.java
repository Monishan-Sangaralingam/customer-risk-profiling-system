package com.fraud.transaction_service.platform;
import java.util.Map;
import org.springframework.http.*;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.dao.DataIntegrityViolationException;
@RestControllerAdvice(basePackages="com.fraud.transaction_service.platform")
@org.springframework.core.annotation.Order(org.springframework.core.Ordered.HIGHEST_PRECEDENCE)
public class PlatformErrorHandler {
    @ExceptionHandler(ResponseStatusException.class) ResponseEntity<?> status(ResponseStatusException error) {
        return ResponseEntity.status(error.getStatusCode()).body(Map.of("message",error.getReason()==null?"Request failed":error.getReason()));
    }
    @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> validation(MethodArgumentNotValidException error) {
        var field=error.getBindingResult().getFieldErrors().get(0);
        return ResponseEntity.badRequest().body(Map.of("message",field.getField()+": "+field.getDefaultMessage()));
    }
    @ExceptionHandler(DataIntegrityViolationException.class) ResponseEntity<?> conflict() {
        return ResponseEntity.status(409).body(Map.of("message","This record already exists. Refresh and try again."));
    }
}
