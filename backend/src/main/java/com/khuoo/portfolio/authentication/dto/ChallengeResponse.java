package com.khuoo.portfolio.authentication.dto;

import com.khuoo.portfolio.authentication.domain.VerificationChallenge;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.UUID;

// 이메일 인증 Challenge 발급 응답
public record ChallengeResponse(
        @Schema(description = "Challenge 식별자", example = "550e8400-e29b-41d4-a716-446655440000")
        UUID challengeId,

        @Schema(description = "인증번호 만료시각", example = "2026-08-27T04:00:00+09:00")
        OffsetDateTime expiresAt
) {

    // Challenge Entity 기반 발급 응답 생성
    public static ChallengeResponse from(VerificationChallenge challenge) {
        return new ChallengeResponse(challenge.getId(), challenge.getExpiresAt());
    }
}
