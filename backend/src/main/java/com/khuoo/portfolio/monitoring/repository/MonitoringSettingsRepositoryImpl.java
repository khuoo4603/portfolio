package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.monitoring.domain.MonitoringSettings;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

// JPA 기반 Monitoring 설정 변경 Repository 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MonitoringSettingsRepositoryImpl implements MonitoringSettingsRepository {

    private static final short SETTINGS_ID = 1;

    private final EntityManager entityManager;

    // Singleton 설정 조회
    @Override
    public Optional<MonitoringSettings> findSettings() {
        return Optional.ofNullable(entityManager.find(MonitoringSettings.class, SETTINGS_ID));
    }

    // 변경 SQL 즉시 반영
    @Override
    @Transactional
    public void flush() {
        entityManager.flush();
    }
}
