package com.fraud.transaction_service.platform;
import java.sql.SQLException;
import java.util.Map;
import javax.sql.DataSource;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/system") @RequiredArgsConstructor
public class SystemInfoController {
    private final DataSource dataSource;
    @GetMapping("/info") public Map<String,String> info() throws SQLException {
        try(var connection=dataSource.getConnection()) {
            var metadata=connection.getMetaData();
            return Map.of("database",metadata.getDatabaseProductName(),"databaseVersion",metadata.getDatabaseProductVersion());
        }
    }
}
