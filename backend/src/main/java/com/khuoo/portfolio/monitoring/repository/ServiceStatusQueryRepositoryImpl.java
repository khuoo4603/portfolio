package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.util.PortfolioEnums.ServiceStatus;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.List;

// PostgreSQL 기반 저장된 서비스 현재 상태 조회 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ServiceStatusQueryRepositoryImpl implements ServiceStatusQueryRepository {

    private final EntityManager entityManager;

    // 고정 대상 중 DB에 존재하는 상태 Row만 조회
    @Override
    public List<StatusView> findCurrent() {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT service_key, status, response_time_ms, http_status, last_checked_at
                        FROM service_status
                        WHERE service_key IN (:serviceKeys)
                        """)
                .setParameter("serviceKeys", PortfolioConstants.ServiceKey.ORDERED)
                .getResultList();
        return rows.stream()
                .map(this::toView)
                .sorted(Comparator.comparingInt(view ->
                        PortfolioConstants.ServiceKey.ORDERED.indexOf(view.serviceKey())))
                .toList();
    }

    private StatusView toView(Object[] row) {
        return new StatusView(
                (String) row[0],
                ServiceStatus.valueOf((String) row[1]),
                integer(row[2]),
                integer(row[3]),
                offsetDateTime(row[4])
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
