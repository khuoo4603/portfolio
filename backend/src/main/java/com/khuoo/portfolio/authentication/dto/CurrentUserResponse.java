package com.khuoo.portfolio.authentication.dto;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import io.swagger.v3.oas.annotations.media.Schema;

// 현재 Session 계정 공개 정보 응답
public record CurrentUserResponse(
        @Schema(description = "계정 식별자", example = "1")
        Long id,

        @Schema(description = "로그인 이메일", example = "user@example.com")
        String email,

        @Schema(description = "계정 이름", example = "사용자 이름")
        String name,

        @Schema(description = "계정 권한", example = "USER")
        AccountRole role
) {

    // 계정 Entity의 공개 필드 변환
    public static CurrentUserResponse from(Account account) {
        return new CurrentUserResponse(
                account.getId(),
                account.getEmail(),
                account.getName(),
                account.getRole()
        );
    }
}
