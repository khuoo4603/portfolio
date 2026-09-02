package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 사용자 접근 가능한 Tool Link 목록 응답
public record ToolLinkListResponse(
        @Schema(description = "활성 Tool Link 목록")
        List<ToolLinkResponse> items
) {
}
