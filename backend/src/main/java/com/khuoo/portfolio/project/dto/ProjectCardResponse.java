package com.khuoo.portfolio.project.dto;

import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.site.dto.TechnologyResponse;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 공개 메인 프로젝트 카드 응답
public record ProjectCardResponse(
        @Schema(description = "프로젝트 식별자", example = "1")
        Long id,

        @Schema(description = "공개 상세 Route slug", example = "kyvc")
        String slug,

        @Schema(description = "프로젝트명", example = "KYvC")
        String name,

        @Schema(description = "프로젝트 연도", example = "2026")
        Short year,

        @Schema(description = "프로젝트 한 줄 설명")
        String tagline,

        @Schema(description = "프로젝트 카드 설명")
        String description,

        @Schema(description = "프로젝트 카드 역할", example = "백엔드 · 인프라")
        String cardRole,

        @Schema(description = "대표 이미지 경로", nullable = true)
        String thumbnailUrl,

        @Schema(description = "카드 노출 기술")
        List<TechnologyResponse> technologies
) {

    // 프로젝트 Entity와 카드 기술의 공개 응답 변환
    public static ProjectCardResponse from(Project project, List<TechnologyResponse> technologies) {
        return new ProjectCardResponse(
                project.getId(),
                project.getSlug(),
                project.getName(),
                project.getYear(),
                project.getTagline(),
                project.getDescription(),
                project.getCardRole(),
                ProjectMediaUrl.publicThumbnail(project),
                technologies
        );
    }
}
