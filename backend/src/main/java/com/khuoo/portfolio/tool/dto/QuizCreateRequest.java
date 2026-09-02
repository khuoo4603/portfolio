package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import tools.jackson.databind.JsonNode;

// 사용자 Quiz 저장 요청
public record QuizCreateRequest(
        @NotBlank
        @Size(max = 200)
        @Schema(description = "저장 Quiz 표시 제목", example = "Java 기초 문제")
        String title,

        @NotNull
        @Schema(description = "Quiz 문제 원본 JSON", implementation = Object.class)
        JsonNode quizJson,

        @Schema(description = "현재 사용자 풀이 JSON", implementation = Object.class, nullable = true)
        JsonNode responseJson
) {
}
