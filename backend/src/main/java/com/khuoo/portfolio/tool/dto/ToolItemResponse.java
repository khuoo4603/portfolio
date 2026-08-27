package com.khuoo.portfolio.tool.dto;

import com.khuoo.portfolio.tool.domain.Tool;
import io.swagger.v3.oas.annotations.media.Schema;

// Tool Launcher 표시 항목 응답
public record ToolItemResponse(
        @Schema(description = "Tool 식별 Key", example = "QUIZ")
        String toolKey,

        @Schema(description = "Tool 표시명", example = "Quiz")
        String name
) {

    // Tool Entity의 Launcher 응답 변환
    public static ToolItemResponse from(Tool tool) {
        return new ToolItemResponse(tool.getToolKey(), tool.getName());
    }
}
