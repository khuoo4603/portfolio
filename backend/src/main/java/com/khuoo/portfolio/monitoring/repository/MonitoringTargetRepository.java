package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.monitoring.domain.MonitoringTarget;

import java.util.List;
import java.util.Optional;

// Monitoring 대상 단건 변경 Repository 경계
public interface MonitoringTargetRepository {

    // Target ID 기반 조회
    Optional<MonitoringTarget> findTarget(Long targetId);

    // Monitoring 대상 전체의 배타 잠금 조회
    List<MonitoringTarget> findTargetsForUpdate();

    // Service Key 중복 여부 조회
    boolean existsServiceKey(String serviceKey);

    // Target 저장
    MonitoringTarget saveTarget(MonitoringTarget target);

    // 변경 SQL 즉시 반영
    void flush();
}
