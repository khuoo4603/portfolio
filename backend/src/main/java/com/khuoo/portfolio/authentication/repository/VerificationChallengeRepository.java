package com.khuoo.portfolio.authentication.repository;

import com.khuoo.portfolio.authentication.domain.VerificationChallenge;

import java.util.Optional;
import java.util.UUID;

// Challenge 생성과 동시성 보호 단건 조회 경계
public interface VerificationChallengeRepository {

    // 신규 Challenge 저장
    VerificationChallenge save(VerificationChallenge challenge);

    // 검증·재발급용 Challenge 배타 잠금 조회
    Optional<VerificationChallenge> findByIdForUpdate(UUID id);
}
