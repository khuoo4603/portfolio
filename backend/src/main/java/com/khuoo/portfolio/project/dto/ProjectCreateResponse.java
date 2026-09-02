package com.khuoo.portfolio.project.dto;

import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.common.util.ResponseTime;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 프로젝트 생성 응답
public record ProjectCreateResponse(
        @Schema(description = "프로젝트 식별자") Long id,
        @Schema(description = "프로젝트명") String name,
        @Schema(description = "공개 상세 Route slug") String slug,
        @Schema(description = "공개 활성 여부") boolean enabled,
        @Schema(description = "표시 순서") int displayOrder,
        @Schema(description = "생성 시각") OffsetDateTime createdAt
) {

    // 프로젝트 Entity의 생성 응답 변환
    public static ProjectCreateResponse from(Project project) {
        return new ProjectCreateResponse(
                project.getId(),
                project.getName(),
                project.getSlug(),
                project.isEnabled(),
                project.getDisplayOrder(),
                ResponseTime.kst(project.getCreatedAt())
        );
    }
}
