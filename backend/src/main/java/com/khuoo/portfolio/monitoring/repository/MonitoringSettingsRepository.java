package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.monitoring.domain.MonitoringSettings;

import java.util.Optional;

// Monitoring 설정 변경 Repository 경계
public interface MonitoringSettingsRepository {

    // Singleton 설정 조회
    Optional<MonitoringSettings> findSettings();

    // 변경 SQL 즉시 반영
    void flush();
}
