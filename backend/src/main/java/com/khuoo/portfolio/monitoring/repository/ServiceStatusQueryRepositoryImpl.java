package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.ServiceStatus;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.List;

// PostgreSQL 기반 저장된 서비스 현재 상태 조회 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ServiceStatusQueryRepositoryImpl implements ServiceStatusQueryRepository {

    private final EntityManager entityManager;

    // 활성 대상과 연결된 DB 상태 Row를 표시 순서대로 조회
    @Override
    public List<StatusView> findCurrent() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT status.service_key, target.display_name, status.status,
                               status.response_time_ms, status.http_status, status.last_checked_at
                        FROM monitoring_targets target
                        JOIN service_status status ON status.service_key = target.service_key
                        WHERE target.enabled = TRUE
                        ORDER BY target.display_order ASC, target.id ASC
                        """)
                .getResultList();
        return rows.stream()
                .map(this::toView)
                .toList();
    }

    private StatusView toView(Object[] row) {
        return new StatusView(
                (String) row[0],
                (String) row[1],
                ServiceStatus.valueOf((String) row[2]),
                integer(row[3]),
                integer(row[4]),
                offsetDateTime(row[5])
        );
    }

    private Integer integer(Object value) {
        return value == null ? null : ((Number) value).intValue();
    }

    private OffsetDateTime offsetDateTime(Object value) {
        if (value instanceof OffsetDateTime offsetDateTime) {
            return offsetDateTime;
        }
        return ((Instant) value).atOffset(java.time.ZoneOffset.UTC);
    }
}
