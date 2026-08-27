package com.khuoo.portfolio.monitoring.service;

import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.util.PortfolioEnums.ServiceStatus;
import com.khuoo.portfolio.monitoring.config.MonitorTarget;
import com.khuoo.portfolio.monitoring.repository.ServiceStatusRepository;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.Optional;

// 고정 대상 Health 검사와 현재 상태 갱신 처리
public class ServiceMonitor {

    private final List<MonitorTarget> targets;
    private final HealthCheckClient healthCheckClient;
    private final ServiceStatusRepository serviceStatusRepository;
    private final LogEventLogger logEventLogger;
    private final Clock clock;

    public ServiceMonitor(
            List<MonitorTarget> targets,
            HealthCheckClient healthCheckClient,
            ServiceStatusRepository serviceStatusRepository,
            LogEventLogger logEventLogger,
            Clock clock
    ) {
        this.targets = targets;
        this.healthCheckClient = healthCheckClient;
        this.serviceStatusRepository = serviceStatusRepository;
        this.logEventLogger = logEventLogger;
        this.clock = clock;
    }

    // 여섯 서비스 상태 순차 확인 및 대상별 실패 격리
    public void checkAll() {
        for (MonitorTarget target : targets) {
            try {
                check(target);
            } catch (RuntimeException exception) {
                logEventLogger.error(
                        "monitoring.check.failure",
                        "서비스 상태 확인 처리 실패",
                        Map.of("serviceKey", target.serviceKey()),
                        exception
                );
            }
        }
    }

    // 단일 서비스 검사 결과 Upsert 및 실제 상태 변화 기록
    public HealthCheckClient.HealthCheckResult check(MonitorTarget target) {
        HealthCheckClient.HealthCheckResult result = healthCheckClient.check(target.uri());
        Optional<ServiceStatus> previousStatus = serviceStatusRepository.upsert(
                target.serviceKey(),
                result.status(),
                result.responseTimeMs(),
                result.httpStatus(),
                OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC)
        );
        previousStatus.filter(previous -> previous != result.status())
                .ifPresent(previous -> logStatusChange(target.serviceKey(), previous, result.status()));
        return result;
    }

    private void logStatusChange(String serviceKey, ServiceStatus previous, ServiceStatus status) {
        Map<String, Object> fields = Map.of(
                "serviceKey", serviceKey,
                "previousStatus", previous,
                "status", status
        );
        if (status == ServiceStatus.DOWN) {
            logEventLogger.warn("monitoring.service.down", "서비스 장애 감지", fields);
            return;
        }
        logEventLogger.info("monitoring.service.recovered", "서비스 정상 상태 복구", fields);
    }
}
