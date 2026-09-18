package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.monitoring.domain.MonitoringSettings;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

// JPA 기반 Monitoring Runtime 설정 조회 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MonitoringSettingsQueryRepositoryImpl implements MonitoringSettingsQueryRepository {

    private static final short SETTINGS_ID = 1;

    private final EntityManager entityManager;

    // 현재 Runtime 설정 조회
    @Override
    public Optional<MonitoringSettings> findCurrent() {
        return Optional.ofNullable(entityManager.find(MonitoringSettings.class, SETTINGS_ID));
    }
}
