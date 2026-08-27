package com.khuoo.portfolio.authentication.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.khuoo.portfolio.authentication.domain.VerificationChallenge;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.UUID;

// USER 로그인 완료 또는 ADMIN 이메일 인증 대기 응답
@JsonInclude(JsonInclude.Include.NON_NULL)
public record LoginResponse(
        @Schema(description = "인증 완료 여부", example = "true")
        boolean authenticated,

        @Schema(description = "로그인 완료 계정 권한", example = "USER")
        AccountRole role,

        @Schema(description = "로그인 완료 후 이동 경로", example = "/tools")
        String redirect,

        @Schema(description = "ADMIN 이메일 인증 필요 여부", example = "true")
        Boolean adminVerificationRequired,

        @Schema(description = "ADMIN_LOGIN Challenge 식별자")
        UUID challengeId,

        @Schema(description = "ADMIN_LOGIN 인증번호 만료시각")
        OffsetDateTime expiresAt
) {

    // USER 로그인 완료 응답 생성
    public static LoginResponse user() {
        return authenticated(AccountRole.USER, "/tools");
    }

    // ADMIN 로그인 완료 응답 생성
    public static LoginResponse admin() {
        return authenticated(AccountRole.ADMIN, "/admin");
    }

    // ADMIN 이메일 인증 대기 응답 생성
    public static LoginResponse adminChallenge(VerificationChallenge challenge) {
        return new LoginResponse(
                false,
                null,
                null,
                true,
                challenge.getId(),
                challenge.getExpiresAt()
        );
    }

    private static LoginResponse authenticated(AccountRole role, String redirect) {
        return new LoginResponse(true, role, redirect, null, null, null);
    }
}
