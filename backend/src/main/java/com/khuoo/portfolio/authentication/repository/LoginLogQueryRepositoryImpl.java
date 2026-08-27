package com.khuoo.portfolio.authentication.repository;

import com.khuoo.portfolio.common.util.EmailNormalizer;
import com.khuoo.portfolio.common.util.PortfolioEnums.LoginFailureReason;
import jakarta.persistence.EntityManager;
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
}
