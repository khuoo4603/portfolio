package com.khuoo.portfolio.monitoring.scheduler;

import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.monitoring.service.LogCleanupService;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;

// Backend Web Context 전용 운영 로그 보관 정리 Scheduler
@Component
@RequiredArgsConstructor
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class LogCleanupScheduler {

    private final LogCleanupService logCleanupService;
    private final LogEventLogger logEventLogger;

    // KST 03:00 기준 운영 로그 보관기간 정리
    @Scheduled(cron = "0 0 3 * * *", zone = "Asia/Seoul")
    public void cleanup() {
        try {
            LogCleanupService.CleanupResult result = logCleanupService.cleanup();
            logEventLogger.info(
                    "monitoring.log-cleanup.success",
                    "운영 로그 보관기간 정리 완료",
                    Map.of(
                            "loginLogs", result.loginLogs(),
                            "errorLogs", result.errorLogs()
                    )
            );
        } catch (RuntimeException exception) {
            logEventLogger.error(
                    "monitoring.log-cleanup.failure",
                    "운영 로그 보관기간 정리 실패",
                    exception
            );
        }
    }
}
