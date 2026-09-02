package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.ServiceStatus;

import java.time.OffsetDateTime;
import java.util.Optional;

// 서비스별 현재 Health 상태 저장 경계
public interface ServiceStatusRepository {

    // 현재 검사 결과 Upsert 및 기존 상태 반환
    Optional<ServiceStatus> upsert(
            String serviceKey,
            ServiceStatus status,
            Integer responseTimeMs,
            Integer httpStatus,
            OffsetDateTime checkedAt
    );
}
