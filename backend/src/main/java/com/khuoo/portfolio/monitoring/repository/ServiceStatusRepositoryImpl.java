package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.ServiceStatus;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

// PostgreSQL Upsert 기반 서비스 현재 상태 저장 구현
@Repository
@RequiredArgsConstructor
public class ServiceStatusRepositoryImpl implements ServiceStatusRepository {

    private final EntityManager entityManager;

    // 기존 상태 조회 후 Service Key 단일 Row Upsert
    @Override
    @Transactional
    public Optional<ServiceStatus> upsert(
            String serviceKey,
            ServiceStatus status,
            Integer responseTimeMs,
            Integer httpStatus,
            OffsetDateTime checkedAt
    ) {
        Optional<ServiceStatus> previousStatus = entityManager.createNativeQuery("""
                        SELECT status
                        FROM service_status
                        WHERE service_key = :serviceKey
                        """, String.class)
                .setParameter("serviceKey", serviceKey)
                .getResultStream()
                .map(value -> ServiceStatus.valueOf((String) value))
                .findFirst();

        entityManager.createNativeQuery("""
                        INSERT INTO service_status (
                            service_key,
                            status,
                            response_time_ms,
                            http_status,
                            last_checked_at
                        ) VALUES (
                            :serviceKey,
                            :status,
                            :responseTimeMs,
                            CAST(:httpStatus AS SMALLINT),
                            :checkedAt
                        )
                        ON CONFLICT (service_key) DO UPDATE SET
                            status = EXCLUDED.status,
                            response_time_ms = EXCLUDED.response_time_ms,
                            http_status = EXCLUDED.http_status,
                            last_checked_at = EXCLUDED.last_checked_at
                        """)
                .setParameter("serviceKey", serviceKey)
                .setParameter("status", status.name())
                .setParameter("responseTimeMs", responseTimeMs)
                .setParameter("httpStatus", httpStatus)
                .setParameter("checkedAt", checkedAt)
                .executeUpdate();
        return previousStatus;
    }
}
