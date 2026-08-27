package com.khuoo.portfolio.authentication.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import io.swagger.v3.oas.annotations.media.Schema;

// USER 로그인 완료 응답
public record LoginResponse(
        @Schema(description = "인증 완료 여부", example = "true")
        boolean authenticated,

        @Schema(description = "로그인 계정 권한", example = "USER")
        AccountRole role,

        @Schema(description = "로그인 완료 후 이동 경로", example = "/tools")
        String redirect
) {

    // USER 로그인 완료 응답 생성
    public static LoginResponse user() {
        return new LoginResponse(true, AccountRole.USER, "/tools");
    }
}
