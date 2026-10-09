package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// Quiz 과목 목록 응답
public record QuizSubjectListResponse(
        @Schema(description = "과목 목록")
        List<QuizSubjectResponse> items
) {
}
