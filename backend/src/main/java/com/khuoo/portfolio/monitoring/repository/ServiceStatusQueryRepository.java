package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.ServiceStatus;

import java.time.OffsetDateTime;
import java.util.List;

// 저장된 서비스 현재 상태 조회 경계
public interface ServiceStatusQueryRepository {

    // 활성 Monitoring 대상 순서 기반 실제 상태 Row 조회
    List<StatusView> findCurrent();

    // 서비스 현재 상태 조회값
    record StatusView(
            String serviceKey,
            String displayName,
            ServiceStatus status,
            Integer responseTimeMs,
            Integer httpStatus,
            OffsetDateTime lastCheckedAt
    ) {
    }
}
