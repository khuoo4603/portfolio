package com.khuoo.portfolio.monitoring.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

// Monitoring 실행 정책 Singleton 설정
@Getter
@Entity
@Table(name = "monitoring_settings")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MonitoringSettings {

    @Id
    private short id;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "check_interval_seconds", nullable = false)
    private int checkIntervalSeconds;

    @Column(name = "connect_timeout_ms", nullable = false)
    private int connectTimeoutMs;

    @Column(name = "request_timeout_ms", nullable = false)
    private int requestTimeoutMs;

    @Column(name = "retry_delay_ms", nullable = false)
    private int retryDelayMs;

    @Column(name = "max_retries", nullable = false)
    private int maxRetries;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    // Runtime 설정 값 변경
    public void update(
            boolean enabled,
            int checkIntervalSeconds,
            int connectTimeoutMs,
            int requestTimeoutMs,
            int retryDelayMs,
            int maxRetries,
            OffsetDateTime updatedAt
    ) {
        this.enabled = enabled;
        this.checkIntervalSeconds = checkIntervalSeconds;
        this.connectTimeoutMs = connectTimeoutMs;
        this.requestTimeoutMs = requestTimeoutMs;
        this.retryDelayMs = retryDelayMs;
        this.maxRetries = maxRetries;
        this.updatedAt = updatedAt;
    }
}
