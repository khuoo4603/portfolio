package com.khuoo.portfolio.tool.dto;

import com.khuoo.portfolio.tool.domain.Tool;
import io.swagger.v3.oas.annotations.media.Schema;

// 관리자 Tool 활성 상태 응답
public record AdminToolResponse(
        @Schema(description = "Tool 식별 Key", example = "QUIZ")
        String toolKey,

        @Schema(description = "Tool 표시명", example = "Quiz")
        String name,

        @Schema(description = "Tool 활성 여부")
        boolean enabled
) {

    // Tool Entity의 관리자 응답 변환
    public static AdminToolResponse from(Tool tool) {
        return new AdminToolResponse(tool.getToolKey(), tool.getName(), tool.isEnabled());
    }
}
