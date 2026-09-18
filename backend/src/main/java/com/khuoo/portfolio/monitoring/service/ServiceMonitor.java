package com.khuoo.portfolio.monitoring.service;

import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.util.PortfolioEnums.ServiceStatus;
import com.khuoo.portfolio.monitoring.domain.MonitoringTarget;
import com.khuoo.portfolio.monitoring.repository.MonitoringSettingsQueryRepository;
import com.khuoo.portfolio.monitoring.repository.MonitoringTargetQueryRepository;
import com.khuoo.portfolio.monitoring.repository.ServiceStatusRepository;

import java.net.URI;
import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.Map;
import java.util.Optional;

// DB Runtime 대상 Health 검사와 현재 상태 갱신 처리
public class ServiceMonitor {

    private final MonitoringSettingsQueryRepository monitoringSettingsQueryRepository;
    private final MonitoringTargetQueryRepository monitoringTargetQueryRepository;
    private final HealthCheckClient healthCheckClient;
    private final ServiceStatusRepository serviceStatusRepository;
    private final LogEventLogger logEventLogger;
    private final Clock clock;

    public ServiceMonitor(
            MonitoringSettingsQueryRepository monitoringSettingsQueryRepository,
            MonitoringTargetQueryRepository monitoringTargetQueryRepository,
            HealthCheckClient healthCheckClient,
            ServiceStatusRepository serviceStatusRepository,
            LogEventLogger logEventLogger,
            Clock clock
    ) {
        this.monitoringSettingsQueryRepository = monitoringSettingsQueryRepository;
        this.monitoringTargetQueryRepository = monitoringTargetQueryRepository;
        this.healthCheckClient = healthCheckClient;
        this.serviceStatusRepository = serviceStatusRepository;
        this.logEventLogger = logEventLogger;
        this.clock = clock;
    }

    // DB 설정 Snapshot 기반 활성 대상 상태 순차 확인
    public void checkAll() {
        MonitoringRuntimeSettings settings;
        try {
            settings = monitoringSettingsQueryRepository.findCurrent()
                    .map(MonitoringRuntimeSettings::from)
                    .orElseThrow(() -> new IllegalStateException("Monitoring Runtime 설정 없음"));
        } catch (RuntimeException exception) {
            logEventLogger.error("monitoring.settings.failure", "Monitoring Runtime 설정 조회 실패", exception);
            return;
        }
        if (!settings.enabled()) {
            return;
        }

        for (MonitoringTarget target : monitoringTargetQueryRepository.findEnabled()) {
            try {
                check(target, settings);
            } catch (RuntimeException exception) {
                logEventLogger.error(
                        "monitoring.check.failure",
                        "서비스 상태 확인 처리 실패",
                        Map.of("serviceKey", target.getServiceKey()),
                        exception
                );
            }
        }
    }

    // 단일 DB 대상 검사 결과 Upsert 및 실제 상태 변화 기록
    public HealthCheckClient.HealthCheckResult check(MonitoringTarget target, MonitoringRuntimeSettings settings) {
        HealthCheckClient.HealthCheckResult result;
        try {
            result = healthCheckClient.check(URI.create(target.getHealthUrl()), settings);
        } catch (RuntimeException exception) {
            logEventLogger.error(
                    "monitoring.check.failure",
                    "서비스 Health URL 처리 실패",
                    Map.of("serviceKey", target.getServiceKey()),
                    exception
            );
            result = HealthCheckClient.HealthCheckResult.unreachable();
        }
        HealthCheckClient.HealthCheckResult finalResult = result;
        Optional<ServiceStatus> previousStatus = serviceStatusRepository.upsert(
                target.getServiceKey(),
                finalResult.status(),
                finalResult.responseTimeMs(),
                finalResult.httpStatus(),
                OffsetDateTime.now(clock).withOffsetSameInstant(ZoneOffset.UTC)
        );
        previousStatus.filter(previous -> previous != finalResult.status())
                .ifPresent(previous -> logStatusChange(target.getServiceKey(), previous, finalResult.status()));
        return finalResult;
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
