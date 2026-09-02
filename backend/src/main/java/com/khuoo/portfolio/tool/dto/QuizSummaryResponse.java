package com.khuoo.portfolio.tool.dto;

import com.khuoo.portfolio.tool.repository.QuizSummaryView;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

// JSONB 본문을 제외한 저장 Quiz 요약 응답
public record QuizSummaryResponse(
        @Schema(description = "저장 Quiz 식별자", example = "1")
        Long id,

        @Schema(description = "저장 Quiz 표시 제목", example = "Java 기초 문제")
        String title,

        @Schema(description = "최초 저장 시각")
        OffsetDateTime createdAt,

        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    // Quiz 요약 조회 결과의 API 응답 변환
    public static QuizSummaryResponse from(QuizSummaryView quiz) {
        return new QuizSummaryResponse(
                quiz.id(),
                quiz.title(),
                kst(quiz.createdAt()),
                kst(quiz.updatedAt())
        );
    }

    private static OffsetDateTime kst(OffsetDateTime value) {
        return value == null ? null : value.withOffsetSameInstant(KST);
    }
}
