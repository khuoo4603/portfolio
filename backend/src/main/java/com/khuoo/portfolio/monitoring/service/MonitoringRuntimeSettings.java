package com.khuoo.portfolio.monitoring.service;

import com.khuoo.portfolio.monitoring.domain.MonitoringSettings;

import java.time.Duration;

// 단일 Monitoring Cycle 전용 불변 설정 Snapshot
public record MonitoringRuntimeSettings(
        boolean enabled,
        Duration checkInterval,
        Duration connectTimeout,
        Duration requestTimeout,
        Duration retryDelay,
        int maxRetries
) {

    // DB Runtime Entity 기반 실행 Snapshot 생성
    public static MonitoringRuntimeSettings from(MonitoringSettings settings) {
        return new MonitoringRuntimeSettings(
                settings.isEnabled(),
                Duration.ofSeconds(settings.getCheckIntervalSeconds()),
                Duration.ofMillis(settings.getConnectTimeoutMs()),
                Duration.ofMillis(settings.getRequestTimeoutMs()),
                Duration.ofMillis(settings.getRetryDelayMs()),
                settings.getMaxRetries()
        );
    }
}
