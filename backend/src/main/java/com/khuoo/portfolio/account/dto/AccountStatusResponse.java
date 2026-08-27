package com.khuoo.portfolio.account.dto;

import com.khuoo.portfolio.account.domain.Account;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 계정 활성 상태 변경 결과
public record AccountStatusResponse(
        @Schema(description = "계정 식별자", example = "2")
        Long id,

        @Schema(description = "계정 활성 여부", example = "false")
        boolean enabled,

        @Schema(description = "마지막 변경시각")
        OffsetDateTime updatedAt
) {

    // 변경 Account 기반 상태 응답 변환
    public static AccountStatusResponse from(Account account) {
        return new AccountStatusResponse(account.getId(), account.isEnabled(), account.getUpdatedAt());
    }
}
