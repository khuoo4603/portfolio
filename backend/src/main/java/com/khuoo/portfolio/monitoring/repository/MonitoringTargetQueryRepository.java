package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.monitoring.domain.MonitoringTarget;

import java.util.List;

// Monitoring 대상 목록 조회 Repository 경계
public interface MonitoringTargetQueryRepository {

    // 표시 순서 기반 전체 대상 조회
    List<MonitoringTarget> findAll();

    // Runtime 실행용 활성 대상 조회
    List<MonitoringTarget> findEnabled();
}
