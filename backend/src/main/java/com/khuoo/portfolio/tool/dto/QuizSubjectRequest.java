package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;

// Quiz 과목 생성과 이름 변경 요청
public record QuizSubjectRequest(
        @Schema(description = "과목 표시명", example = "자료구조")
        String name
) {
}
