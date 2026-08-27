package com.khuoo.portfolio.account.dto;

import com.khuoo.portfolio.account.repository.AccountListEntry;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 계정 목록 항목
public record AdminAccountItemResponse(
        @Schema(description = "계정 식별자", example = "1")
        Long id,

        @Schema(description = "로그인 이메일", example = "user@example.com")
        String email,

        @Schema(description = "계정 이름", example = "홍길동")
        String name,

        @Schema(description = "계정 권한", example = "USER")
        AccountRole role,

        @Schema(description = "계정 활성 여부", example = "true")
        boolean enabled,

        @Schema(description = "최근 로그인 성공시각", nullable = true)
        OffsetDateTime recentLoginAt
) {

    // Repository 조회 결과 기반 목록 항목 변환
    public static AdminAccountItemResponse from(AccountListEntry entry) {
        return new AdminAccountItemResponse(
                entry.account().getId(),
                entry.account().getEmail(),
                entry.account().getName(),
                entry.account().getRole(),
                entry.account().isEnabled(),
                entry.recentLoginAt()
        );
    }
}
