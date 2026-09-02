package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.ErrorService;
import com.khuoo.portfolio.monitoring.domain.ErrorLog;
import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

// JPA 기반 HTTP 5xx 요약 기록 필터·Pagination 조회 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ErrorLogQueryRepositoryImpl implements ErrorLogQueryRepository {

    private final EntityManager entityManager;

    // 기간·서비스·HTTP Status 조건 기반 최신순 오류 기록 Page 조회
    @Override
    public ErrorLogPage findLogs(
            OffsetDateTime from,
            OffsetDateTime to,
            ErrorService service,
            Integer statusCode,
            int page,
            int size
    ) {
        String conditions = conditions(from, to, service, statusCode);
        TypedQuery<ErrorLog> itemQuery = entityManager.createQuery(
                "SELECT error FROM ErrorLog error " + conditions
                        + " ORDER BY error.occurredAt DESC, error.id DESC",
                ErrorLog.class
        );
        TypedQuery<Long> countQuery = entityManager.createQuery(
                "SELECT COUNT(error) FROM ErrorLog error " + conditions,
                Long.class
        );
        parameters(itemQuery, from, to, service, statusCode);
        parameters(countQuery, from, to, service, statusCode);
        return new ErrorLogPage(
                itemQuery.setFirstResult(page * size).setMaxResults(size).getResultList(),
                countQuery.getSingleResult()
        );
    }

    private String conditions(
            OffsetDateTime from,
            OffsetDateTime to,
            ErrorService service,
            Integer statusCode
    ) {
        StringBuilder jpql = new StringBuilder("WHERE 1 = 1");
        if (from != null) {
            jpql.append(" AND error.occurredAt >= :from");
        }
        if (to != null) {
            jpql.append(" AND error.occurredAt <= :to");
        }
        if (service != null) {
            jpql.append(" AND error.service = :service");
        }
        if (statusCode != null) {
            jpql.append(" AND error.statusCode = :statusCode");
        }
        return jpql.toString();
    }

    private void parameters(
            Query query,
            OffsetDateTime from,
            OffsetDateTime to,
            ErrorService service,
            Integer statusCode
    ) {
        if (from != null) {
            query.setParameter("from", from);
        }
        if (to != null) {
            query.setParameter("to", to);
        }
        if (service != null) {
            query.setParameter("service", service);
        }
        if (statusCode != null) {
            query.setParameter("statusCode", statusCode.shortValue());
        }
    }
}
