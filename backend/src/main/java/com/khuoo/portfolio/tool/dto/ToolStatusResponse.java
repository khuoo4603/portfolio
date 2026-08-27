package com.khuoo.portfolio.tool.dto;

import com.khuoo.portfolio.tool.domain.Tool;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

// 관리자 Tool 활성 상태 변경 응답
public record ToolStatusResponse(
        @Schema(description = "Tool 식별 Key", example = "QUIZ")
        String toolKey,

        @Schema(description = "Tool 표시명", example = "Quiz")
        String name,

        @Schema(description = "Tool 활성 여부")
        boolean enabled,

        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    // Tool Entity의 상태 변경 응답 변환
    public static ToolStatusResponse from(Tool tool) {
        OffsetDateTime updatedAt = tool.getUpdatedAt();
        return new ToolStatusResponse(
                tool.getToolKey(),
                tool.getName(),
                tool.isEnabled(),
                updatedAt == null ? null : updatedAt.withOffsetSameInstant(KST)
        );
    }
}
