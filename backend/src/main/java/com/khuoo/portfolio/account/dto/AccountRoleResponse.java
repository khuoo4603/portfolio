package com.khuoo.portfolio.account.dto;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 계정 권한 변경 결과
public record AccountRoleResponse(
        @Schema(description = "계정 식별자", example = "2")
        Long id,

        @Schema(description = "계정 권한", example = "ADMIN")
        AccountRole role,

        @Schema(description = "마지막 변경시각")
        OffsetDateTime updatedAt
) {

    // 변경 Account 기반 권한 응답 변환
    public static AccountRoleResponse from(Account account) {
        return new AccountRoleResponse(account.getId(), account.getRole(), account.getUpdatedAt());
    }
}
