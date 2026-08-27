package com.khuoo.portfolio.authentication.repository;

import com.khuoo.portfolio.authentication.domain.VerificationChallenge;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengePurpose;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengeStatus;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;

// JPA 기반 Challenge 발송 제한과 활성 상태 검색 구현
@Repository
@RequiredArgsConstructor
public class VerificationChallengeQueryRepositoryImpl implements VerificationChallengeQueryRepository {

    private final EntityManager entityManager;

    // 계정·목적 기준 활성 Challenge 배타 잠금 조회
    @Override
    public List<VerificationChallenge> findActiveForUpdate(Long accountId, ChallengePurpose purpose) {
        return entityManager.createQuery("""
                        SELECT challenge
                        FROM VerificationChallenge challenge
                        WHERE challenge.accountId = :accountId
                          AND challenge.purpose = :purpose
                          AND challenge.status = :status
                        ORDER BY challenge.createdAt DESC
                        """, VerificationChallenge.class)
                .setParameter("accountId", accountId)
                .setParameter("purpose", purpose)
                .setParameter("status", ChallengeStatus.ACTIVE)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultList();
    }

    // 지정 시각 이후 계정별 Challenge 생성 횟수 조회
    @Override
    @Transactional(readOnly = true)
    public long countCreatedSince(Long accountId, OffsetDateTime since) {
        return entityManager.createQuery("""
                        SELECT COUNT(challenge)
                        FROM VerificationChallenge challenge
                        WHERE challenge.accountId = :accountId
                          AND challenge.createdAt >= :since
                        """, Long.class)
                .setParameter("accountId", accountId)
                .setParameter("since", since)
                .getSingleResult();
    }
}
