package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 관리자 Tool Registry와 Links 통합 응답
public record AdminToolsResponse(
        @Schema(description = "비활성 포함 Tool 목록")
        List<AdminToolResponse> tools,

        @Schema(description = "비활성 포함 Tool Link 목록")
        List<AdminToolLinkResponse> links
) {
}
