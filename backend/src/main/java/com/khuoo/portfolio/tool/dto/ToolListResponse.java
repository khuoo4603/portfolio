package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 사용자 접근 가능한 Tool 목록 응답
public record ToolListResponse(
        @Schema(description = "활성 Tool 목록")
        List<ToolItemResponse> items
) {
}
