package com.khuoo.portfolio.authentication.domain;

// Challenge 검증 Transaction 완료 후 API 흐름에 전달하는 결과
public record ChallengeVerificationResult(
        Status status,
        Long accountId,
        boolean rememberMe
) {

    // 검증 결과 분류
    public enum Status {
        SUCCESS,
        NOT_FOUND,
        UNAVAILABLE,
        BINDING_MISMATCH,
        EXPIRED,
        LOCKED,
        INVALID_CODE
    }

    // Challenge 정보 없는 결과 생성
    public static ChallengeVerificationResult empty(Status status) {
        return new ChallengeVerificationResult(status, null, false);
    }

    // Challenge 계정 정보 포함 결과 생성
    public static ChallengeVerificationResult from(Status status, VerificationChallenge challenge) {
        return new ChallengeVerificationResult(
                status,
                challenge.getAccountId(),
                challenge.isRememberMe()
        );
    }

    // 검증과 일회성 소모 성공 여부
    public boolean isSuccess() {
        return status == Status.SUCCESS;
    }
}
