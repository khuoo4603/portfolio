package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

// 관리자 Tool 활성 상태 변경 요청
public record ToolStatusRequest(
        @NotNull(message = "Tool 활성 여부를 입력하세요.")
        @Schema(description = "변경할 Tool 활성 여부", example = "false")
        Boolean enabled
) {
}
