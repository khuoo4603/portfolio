package com.khuoo.portfolio.monitoring.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

// Monitoring 대상 서비스 정보
@Getter
@Entity
@Table(name = "monitoring_targets")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class MonitoringTarget {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "service_key", nullable = false, length = 100, updatable = false)
    private String serviceKey;

    @Column(name = "display_name", nullable = false, length = 100)
    private String displayName;

    @Column(name = "health_url")
    private String healthUrl;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    private MonitoringTarget(
            String serviceKey,
            String displayName,
            String healthUrl,
            boolean enabled,
            int displayOrder
    ) {
        this.serviceKey = serviceKey;
        this.displayName = displayName;
        this.healthUrl = healthUrl;
        this.enabled = enabled;
        this.displayOrder = displayOrder;
    }

    // Monitoring 대상 생성
    public static MonitoringTarget create(
            String serviceKey,
            String displayName,
            String healthUrl,
            boolean enabled,
            int displayOrder
    ) {
        return new MonitoringTarget(serviceKey, displayName, healthUrl, enabled, displayOrder);
    }

    // Monitoring 대상 변경
    public void update(
            String displayName,
            String healthUrl,
            boolean enabled,
            int displayOrder,
            OffsetDateTime updatedAt
    ) {
        this.displayName = displayName;
        this.healthUrl = healthUrl;
        this.enabled = enabled;
        this.displayOrder = displayOrder;
        this.updatedAt = updatedAt;
    }
}
