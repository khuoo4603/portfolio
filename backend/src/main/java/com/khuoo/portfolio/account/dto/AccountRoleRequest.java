package com.khuoo.portfolio.account.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

// 관리자 계정 권한 변경 요청
public record AccountRoleRequest(
        @Schema(description = "변경할 계정 권한", example = "ADMIN")
        @NotNull(message = "계정 권한을 입력하세요.")
        AccountRole role
) {
}
