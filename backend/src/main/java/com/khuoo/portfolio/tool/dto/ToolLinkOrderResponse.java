package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// Tool Link 정렬 저장 후 확정된 순서 응답
public record ToolLinkOrderResponse(
        @Schema(description = "확정된 Tool Link 순서")
        List<AdminToolLinkResponse> items
) {
}
