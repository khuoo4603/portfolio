package com.khuoo.portfolio.tool.repository;

import java.time.OffsetDateTime;

// JSONB 본문을 제외한 저장 Quiz 목록 조회 결과
public record QuizSummaryView(
        Long id,
        String title,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
