package com.khuoo.portfolio.analytics.repository;

import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

// JPA와 PostgreSQL 기반 관리자 대시보드 집계 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardQueryRepositoryImpl implements DashboardQueryRepository {

    private final EntityManager entityManager;

    // 일별 방문 Row와 Page View 합계 조회
    @Override
    public TrafficCount countTraffic(LocalDate from, LocalDate toExclusive) {
        Object[] row = (Object[]) entityManager.createNativeQuery("""
                        SELECT COUNT(*), COALESCE(SUM(page_view_count), 0)
                        FROM daily_visits
                        WHERE visit_date >= :from
                          AND visit_date < :toExclusive
                        """)
                .setParameter("from", from)
                .setParameter("toExclusive", toExclusive)
                .getSingleResult();
        return new TrafficCount(number(row[0]), number(row[1]));
    }

    // 월 문자열 오름차순 기반 방문자와 Page View 합계 조회
    @Override
    public List<MonthlyTraffic> findMonthlyTraffic(LocalDate from, LocalDate toExclusive) {
        @SuppressWarnings("unchecked")
        List<Object[]> rows = entityManager.createNativeQuery("""
                        SELECT TO_CHAR(visit_date, 'YYYY-MM'),
                               COUNT(*),
                               COALESCE(SUM(page_view_count), 0)
                        FROM daily_visits
                        WHERE visit_date >= :from
                          AND visit_date < :toExclusive
                        GROUP BY TO_CHAR(visit_date, 'YYYY-MM')
                        ORDER BY TO_CHAR(visit_date, 'YYYY-MM') ASC
                        """)
                .setParameter("from", from)
                .setParameter("toExclusive", toExclusive)
                .getResultList();
        return rows.stream()
                .map(row -> new MonthlyTraffic(
                        (String) row[0],
                        number(row[1]),
                        number(row[2])
                ))
                .toList();
    }

    // 공개 프로젝트·메인 기술·활성 Tool·활성 계정 집계
    @Override
    public SiteCount countSite() {
        long publicProjects = entityManager.createQuery("""
                        SELECT COUNT(project)
                        FROM Project project
                        WHERE project.enabled = true
                        """, Long.class)
                .getSingleResult();
        long portfolioTechnologies = entityManager.createQuery("""
                        SELECT COUNT(technology)
                        FROM PortfolioTechnology mapping
                        JOIN Technology technology ON technology.id = mapping.technologyId
                        WHERE technology.enabled = true
                        """, Long.class)
                .getSingleResult();
        long activeTools = entityManager.createQuery("""
                        SELECT COUNT(tool)
                        FROM Tool tool
                        WHERE tool.enabled = true
                        """, Long.class)
                .getSingleResult();
        long activeAccounts = entityManager.createQuery("""
                        SELECT COUNT(account)
                        FROM Account account
                        WHERE account.enabled = true
                        """, Long.class)
                .getSingleResult();
        return new SiteCount(
                publicProjects,
                portfolioTechnologies,
                activeTools,
                activeAccounts
        );
    }

    private long number(Object value) {
        return ((Number) value).longValue();
    }
}
