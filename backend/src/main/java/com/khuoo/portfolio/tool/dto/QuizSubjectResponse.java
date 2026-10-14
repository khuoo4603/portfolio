package com.khuoo.portfolio.tool.dto;

import com.khuoo.portfolio.tool.domain.ToolQuizSubject;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

// Quiz 과목 정보 응답
public record QuizSubjectResponse(
        @Schema(description = "과목 식별자", example = "1")
        Long id,
        @Schema(description = "과목 표시명", example = "자료구조")
        String name,
        @Schema(description = "최초 생성 시각")
        OffsetDateTime createdAt,
        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    // Entity 기반 API 응답 변환
    public static QuizSubjectResponse from(ToolQuizSubject subject) {
        return new QuizSubjectResponse(
                subject.getId(), subject.getName(), kst(subject.getCreatedAt()), kst(subject.getUpdatedAt())
        );
    }

    private static OffsetDateTime kst(OffsetDateTime value) {
        return value == null ? null : value.withOffsetSameInstant(KST);
    }
}
