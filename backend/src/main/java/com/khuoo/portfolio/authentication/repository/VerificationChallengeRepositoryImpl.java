package com.khuoo.portfolio.authentication.repository;

import com.khuoo.portfolio.authentication.domain.VerificationChallenge;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

// JPA 기반 Challenge 생성과 배타 잠금 조회 구현
@Repository
@RequiredArgsConstructor
public class VerificationChallengeRepositoryImpl implements VerificationChallengeRepository {

    private final EntityManager entityManager;

    // 신규 Challenge 저장
    @Override
    @Transactional
    public VerificationChallenge save(VerificationChallenge challenge) {
        entityManager.persist(challenge);
        return challenge;
    }

    // 검증·재발급용 Challenge 배타 잠금 조회
    @Override
    public Optional<VerificationChallenge> findByIdForUpdate(UUID id) {
        return entityManager.createQuery(
                        "SELECT challenge FROM VerificationChallenge challenge WHERE challenge.id = :id",
                        VerificationChallenge.class
                )
                .setParameter("id", id)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultStream()
                .findFirst();
    }
}
