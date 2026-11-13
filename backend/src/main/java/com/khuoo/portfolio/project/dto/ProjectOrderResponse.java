package com.khuoo.portfolio.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 프로젝트 정렬 저장 후 확정된 순서 응답
public record ProjectOrderResponse(
        @Schema(description = "확정된 프로젝트 순서")
        List<AdminProjectSummaryResponse> items
) {
}
