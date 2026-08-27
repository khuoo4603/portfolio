package com.khuoo.portfolio.authentication.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// 관리자 변경 작업 재인증 Challenge 발급 요청
public record AdminActionChallengeRequest(
        @Schema(description = "관리자 변경 작업 종류", example = "PROJECT_UPDATE")
        @NotNull(message = "관리자 작업 종류를 입력하세요.")
        AdminActionOperation operation,

        @Schema(description = "관리자 변경 작업 대상 종류", example = "PROJECT")
        AdminActionTarget targetType,

        @Schema(description = "관리자 변경 작업 대상 식별자", example = "1")
        @Size(max = 100, message = "대상 식별자는 100자 이하여야 합니다.")
        String targetId
) {
}
