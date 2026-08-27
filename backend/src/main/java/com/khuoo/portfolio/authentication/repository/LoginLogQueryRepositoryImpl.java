package com.khuoo.portfolio.authentication.repository;

import com.khuoo.portfolio.authentication.domain.LoginLog;
import com.khuoo.portfolio.common.util.EmailNormalizer;
import com.khuoo.portfolio.common.util.PortfolioEnums.LoginFailureReason;
import com.khuoo.portfolio.monitoring.domain.LoginResult;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

// JPA 기반 로그인 Credential 실패 횟수 집계 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class LoginLogQueryRepositoryImpl implements LoginLogQueryRepository {

    private final EntityManager entityManager;

    // 지정 시각 이후 정규화 이메일 Credential 실패 횟수 조회
    @Override
    public long countFailuresByEmailSince(String email, OffsetDateTime since) {
        return countFailures("login.email = :value", EmailNormalizer.normalize(email), since);
    }

    // 지정 시각 이후 정규화 IP Credential 실패 횟수 조회
    @Override
    public long countFailuresByIpSince(String ipAddress, OffsetDateTime since) {
        return countFailures("login.ipAddress = :value", ipAddress, since);
    }

    // 기간·이메일·결과 조건 기반 최신순 로그인 기록 Page 조회
    @Override
    public LoginLogPage findLogs(
            OffsetDateTime from,
            OffsetDateTime to,
            String email,
            LoginResult result,
            int page,
            int size
    ) {
        String conditions = conditions(from, to, email, result);
        TypedQuery<LoginLog> itemQuery = entityManager.createQuery(
                "SELECT login FROM LoginLog login " + conditions
                        + " ORDER BY login.occurredAt DESC, login.id DESC",
                LoginLog.class
        );
        TypedQuery<Long> countQuery = entityManager.createQuery(
                "SELECT COUNT(login) FROM LoginLog login " + conditions,
                Long.class
        );
        parameters(itemQuery, from, to, email, result);
        parameters(countQuery, from, to, email, result);
        return new LoginLogPage(
                itemQuery.setFirstResult(page * size).setMaxResults(size).getResultList(),
                countQuery.getSingleResult()
        );
    }

    private long countFailures(String condition, String value, OffsetDateTime since) {
        return entityManager.createQuery(
                        "SELECT COUNT(login) FROM LoginLog login "
                                + "WHERE login.success = false "
                                + "AND login.failureReason IN :credentialFailures "
                                + "AND login.occurredAt >= :since AND " + condition,
                        Long.class
                )
                .setParameter("value", value)
                .setParameter("since", since)
                .setParameter("credentialFailures", List.of(
                        LoginFailureReason.INVALID_CREDENTIALS,
                        LoginFailureReason.ACCOUNT_DISABLED
                ))
                .getSingleResult();
    }

    private String conditions(
            OffsetDateTime from,
            OffsetDateTime to,
            String email,
            LoginResult result
    ) {
        StringBuilder jpql = new StringBuilder("WHERE 1 = 1");
        if (from != null) {
            jpql.append(" AND login.occurredAt >= :from");
        }
        if (to != null) {
            jpql.append(" AND login.occurredAt <= :to");
        }
        if (email != null && !email.isBlank()) {
            jpql.append(" AND login.email = :email");
        }
        if (result != null) {
            jpql.append(" AND login.success = :success");
        }
        return jpql.toString();
    }

    private void parameters(
            jakarta.persistence.Query query,
            OffsetDateTime from,
            OffsetDateTime to,
            String email,
            LoginResult result
    ) {
        if (from != null) {
            query.setParameter("from", from);
        }
        if (to != null) {
            query.setParameter("to", to);
        }
        if (email != null && !email.isBlank()) {
            query.setParameter("email", EmailNormalizer.normalize(email));
        }
        if (result != null) {
            query.setParameter("success", result == LoginResult.SUCCESS);
        }
    }
}
