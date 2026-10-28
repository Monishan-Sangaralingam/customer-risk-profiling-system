package com.fraud.transaction_service.platform;
import jakarta.persistence.*;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;
@Entity @Table(name="app_settings") @Getter @Setter
public class AppSettings {
    @Id private Long id=1L;
    @Min(1) @Max(98) private int mediumThreshold=40;
    @Min(2) @Max(100) private int highThreshold=70;
    private boolean fallbackEnabled=true;
    private boolean showHighRisk=true;
    private boolean showMediumRisk=true;
    private boolean showDeclined=true;
}
