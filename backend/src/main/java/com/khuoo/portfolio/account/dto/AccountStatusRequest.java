package com.khuoo.portfolio.account.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

// 관리자 계정 활성 상태 변경 요청
public record AccountStatusRequest(
        @Schema(description = "변경할 계정 활성 여부", example = "false")
        @NotNull(message = "계정 활성 여부를 입력하세요.")
        Boolean enabled
) {
}
