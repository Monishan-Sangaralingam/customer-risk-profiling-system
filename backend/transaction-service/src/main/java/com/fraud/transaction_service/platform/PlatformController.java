package com.fraud.transaction_service.platform;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.RequiredArgsConstructor;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

@RestController @RequestMapping("/api") @RequiredArgsConstructor
public class PlatformController {
    private final AppSettingsRepository settings;
    private final AlertStatusRepository alerts;
    @GetMapping("/settings") public AppSettings getSettings() { return settings.findById(1L).orElseGet(AppSettings::new); }
    @PutMapping("/settings") public AppSettings saveSettings(@Valid @RequestBody AppSettings value) {
        if(value.getMediumThreshold()>=value.getHighThreshold()) throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Medium threshold must be below high threshold");
        value.setId(1L);return settings.save(value);
    }
    public record AlertUpdate(@NotBlank @Pattern(regexp="New|Investigating|Resolved") String status,@NotBlank @Size(max=100) String eventKey) {}
    @GetMapping("/alert-status") public List<AlertStatus> getAlerts() { return alerts.findAll(); }
    @PutMapping("/alert-status/{id}") public AlertStatus updateAlert(@PathVariable String id,@Valid @RequestBody AlertUpdate body) {
        if(!id.matches("(?:risk-(?:high|med)-|tx-dec-)\\d+"))throw new ResponseStatusException(HttpStatus.BAD_REQUEST,"Invalid alert ID");
        AlertStatus value=new AlertStatus();value.setId(id);value.setStatus(body.status());value.setEventKey(body.eventKey());return alerts.save(value);
    }
}
