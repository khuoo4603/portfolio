package com.khuoo.portfolio.account.dto;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 계정 생성 결과
public record AccountCreateResponse(
        @Schema(description = "계정 식별자", example = "2")
        Long id,

        @Schema(description = "정규화 로그인 이메일", example = "user@example.com")
        String email,

        @Schema(description = "계정 이름", example = "홍길동")
        String name,

        @Schema(description = "계정 권한", example = "USER")
        AccountRole role,

        @Schema(description = "계정 활성 여부", example = "true")
        boolean enabled,

        @Schema(description = "계정 생성시각")
        OffsetDateTime createdAt
) {

    // 저장 Account 기반 생성 응답 변환
    public static AccountCreateResponse from(Account account) {
        return new AccountCreateResponse(
                account.getId(),
                account.getEmail(),
                account.getName(),
                account.getRole(),
                account.isEnabled(),
                account.getCreatedAt()
        );
    }
}
