package com.khuoo.portfolio.authentication.service;

import com.khuoo.portfolio.authentication.domain.ChallengeVerificationResult;
import com.khuoo.portfolio.authentication.domain.VerificationChallenge;
import com.khuoo.portfolio.authentication.repository.VerificationChallengeRepository;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengePurpose;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengeStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Objects;
import java.util.UUID;

import static com.khuoo.portfolio.authentication.domain.ChallengeVerificationResult.Status;

// Challenge 배타 잠금 검증과 실패 횟수·일회성 소모 처리
@Service
@RequiredArgsConstructor
public class ChallengeVerifier {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final VerificationChallengeRepository challengeRepository;
    private final PasswordEncoder passwordEncoder;

    // 목적·계정·작업 바인딩 검증과 인증번호 일회성 소모
    @Transactional
    public ChallengeVerificationResult verifyAndConsume(
            UUID challengeId,
            String code,
            ChallengePurpose expectedPurpose,
            Long expectedAccountId,
            AdminActionOperation expectedOperation,
            AdminActionTarget expectedTargetType,
            String expectedTargetId
    ) {
        VerificationChallenge challenge = challengeRepository.findByIdForUpdate(challengeId).orElse(null);
        if (challenge == null) {
            return ChallengeVerificationResult.empty(Status.NOT_FOUND);
        }
        if (challenge.getPurpose() != expectedPurpose) {
            return ChallengeVerificationResult.from(Status.UNAVAILABLE, challenge);
        }
        if (expectedAccountId != null && !Objects.equals(challenge.getAccountId(), expectedAccountId)) {
            return ChallengeVerificationResult.from(Status.BINDING_MISMATCH, challenge);
        }
        if (expectedPurpose == ChallengePurpose.ADMIN_ACTION
                && (!Objects.equals(challenge.getOperation(), expectedOperation)
                || !Objects.equals(challenge.getTargetType(), expectedTargetType)
                || !Objects.equals(challenge.getTargetId(), expectedTargetId))) {
            return ChallengeVerificationResult.from(Status.BINDING_MISMATCH, challenge);
        }
        if (challenge.getStatus() == ChallengeStatus.LOCKED) {
            return ChallengeVerificationResult.from(Status.LOCKED, challenge);
        }
        if (challenge.getStatus() != ChallengeStatus.ACTIVE) {
            return ChallengeVerificationResult.from(Status.UNAVAILABLE, challenge);
        }

        OffsetDateTime now = OffsetDateTime.now(SERVICE_ZONE);
        if (challenge.isExpired(now)) {
            return ChallengeVerificationResult.from(Status.EXPIRED, challenge);
        }
        if (!passwordEncoder.matches(code, challenge.getCodeHash())) {
            Status status = challenge.recordFailure(now) ? Status.LOCKED : Status.INVALID_CODE;
            return ChallengeVerificationResult.from(status, challenge);
        }

        challenge.use(now);
        return ChallengeVerificationResult.from(Status.SUCCESS, challenge);
    }
}
