package com.khuoo.portfolio.authentication.repository;

import com.khuoo.portfolio.authentication.domain.VerificationChallenge;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengePurpose;

import java.time.OffsetDateTime;
import java.util.List;

// Challenge 발송 제한과 활성 상태 검색 경계
public interface VerificationChallengeQueryRepository {

    // 계정·목적 기준 활성 Challenge 배타 잠금 조회
    List<VerificationChallenge> findActiveForUpdate(Long accountId, ChallengePurpose purpose);

    // 지정 시각 이후 계정별 Challenge 생성 횟수 조회
    long countCreatedSince(Long accountId, OffsetDateTime since);
}
