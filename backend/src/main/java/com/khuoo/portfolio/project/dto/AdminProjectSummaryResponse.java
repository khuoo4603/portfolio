package com.khuoo.portfolio.project.dto;

import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.common.util.ResponseTime;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 프로젝트 관리 목록 요약 응답
public record AdminProjectSummaryResponse(
        @Schema(description = "프로젝트 식별자", example = "1")
        Long id,

        @Schema(description = "프로젝트명", example = "KYvC")
        String name,

        @Schema(description = "프로젝트 slug", example = "kyvc")
        String slug,

        @Schema(description = "프로젝트 연도", example = "2026", nullable = true)
        Short year,

        @Schema(description = "공개 활성 여부")
        boolean enabled,

        @Schema(description = "표시 순서")
        int displayOrder,

        @Schema(description = "대표 이미지 경로", nullable = true)
        String thumbnailUrl,

        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {

    // 프로젝트 Entity의 관리자 목록 응답 변환
    public static AdminProjectSummaryResponse from(Project project) {
        return new AdminProjectSummaryResponse(
                project.getId(),
                project.getName(),
                project.getSlug(),
                project.getYear(),
                project.isEnabled(),
                project.getDisplayOrder(),
                ProjectMediaUrl.adminThumbnail(project),
                ResponseTime.kst(project.getUpdatedAt())
        );
    }
}
