package com.khuoo.portfolio.analytics.repository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

// PostgreSQL 기반 일별 익명 방문 집계 저장 구현
@Repository
@RequiredArgsConstructor
public class VisitRepositoryImpl implements VisitRepository {

    private final EntityManager entityManager;

    // UNIQUE Key 충돌 시 Page View와 최종 조회시각 원자적 갱신
    @Override
    @Transactional
    public void increase(LocalDate visitDate, UUID visitorKey, OffsetDateTime viewedAt) {
        entityManager.createNativeQuery("""
                        INSERT INTO daily_visits (
                            visit_date,
                            visitor_key,
                            page_view_count,
                            first_viewed_at,
                            last_viewed_at
                        )
                        VALUES (:visitDate, :visitorKey, 1, :viewedAt, :viewedAt)
                        ON CONFLICT (visit_date, visitor_key)
                        DO UPDATE SET
                            page_view_count = daily_visits.page_view_count + 1,
                            last_viewed_at = EXCLUDED.last_viewed_at
                        """)
                .setParameter("visitDate", visitDate)
                .setParameter("visitorKey", visitorKey)
                .setParameter("viewedAt", viewedAt)
                .executeUpdate();
    }
}
