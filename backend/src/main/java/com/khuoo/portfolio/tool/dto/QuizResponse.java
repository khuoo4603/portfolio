package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.JsonNode;

import java.time.OffsetDateTime;

// 저장 Quiz 문제 원본과 현재 풀이 상세 응답
public record QuizResponse(
        @Schema(description = "저장 Quiz 식별자", example = "1")
        Long id,

        @Schema(description = "저장 Quiz 표시 제목", example = "Java 기초 문제")
        String title,

        @Schema(description = "Quiz 문제 원본 JSON", implementation = Object.class)
        JsonNode quizJson,

        @Schema(description = "현재 사용자 풀이 JSON", implementation = Object.class, nullable = true)
        JsonNode responseJson,

        @Schema(description = "최초 저장 시각")
        OffsetDateTime createdAt,

        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {
}
