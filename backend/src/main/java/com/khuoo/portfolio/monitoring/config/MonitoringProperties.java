package com.khuoo.portfolio.monitoring.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;

// Monitor 실행 여부와 변경 가능한 HTTP 설정
@ConfigurationProperties(prefix = "portfolio.monitoring")
public record MonitoringProperties(
        boolean enabled,
        Duration connectTimeout,
        Duration requestTimeout,
        Duration retryDelay,
        Targets targets
) {

    private static final Duration DEFAULT_CONNECT_TIMEOUT = Duration.ofSeconds(2);
    private static final Duration DEFAULT_REQUEST_TIMEOUT = Duration.ofSeconds(3);
    private static final Duration DEFAULT_RETRY_DELAY = Duration.ofMillis(500);

    public MonitoringProperties {
        connectTimeout = connectTimeout == null ? DEFAULT_CONNECT_TIMEOUT : connectTimeout;
        requestTimeout = requestTimeout == null ? DEFAULT_REQUEST_TIMEOUT : requestTimeout;
        retryDelay = retryDelay == null ? DEFAULT_RETRY_DELAY : retryDelay;
        targets = targets == null ? new Targets(null, null, null, null, null, null) : targets;
    }

    // 여섯 고정 서비스의 환경별 Health URL
    public record Targets(
            String portfolioFrontend,
            String portfolioBackend,
            String kyvcFrontend,
            String kyvcBackend,
            String kyvcCore,
            String shkutrack
    ) {
    }
}
