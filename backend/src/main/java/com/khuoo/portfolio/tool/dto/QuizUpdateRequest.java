package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.JsonNode;

// Quiz 수정 필드의 미전달과 explicit null 구분 요청
public record QuizUpdateRequest(
        @Schema(description = "저장 Quiz 표시 제목", implementation = String.class)
        JsonNode title,

        @Schema(description = "Quiz 문제 원본 JSON", implementation = Object.class)
        JsonNode quizJson,

        @Schema(description = "현재 사용자 풀이 JSON", implementation = Object.class, nullable = true)
        JsonNode responseJson
) {
}
