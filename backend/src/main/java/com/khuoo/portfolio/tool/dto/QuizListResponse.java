package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 현재 사용자 소유 저장 Quiz 목록 응답
public record QuizListResponse(
        @Schema(description = "최근 수정순 Quiz 요약 목록")
        List<QuizSummaryResponse> items
) {
}
