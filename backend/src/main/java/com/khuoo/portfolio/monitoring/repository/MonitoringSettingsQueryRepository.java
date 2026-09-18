package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.monitoring.domain.MonitoringSettings;

import java.util.Optional;

// Monitoring Runtime 설정 조회 Repository 경계
public interface MonitoringSettingsQueryRepository {

    // 현재 Runtime 설정 조회
    Optional<MonitoringSettings> findCurrent();
}
