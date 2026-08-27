package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.site.domain.Project;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.util.List;

// 공개 프로젝트 상세 응답
public record PublicProjectResponse(
        @Schema(description = "프로젝트 식별자", example = "1")
        Long id,

        @Schema(description = "공개 상세 Route slug", example = "kyvc")
        String slug,

        @Schema(description = "프로젝트명", example = "KYvC")
        String name,

        @Schema(description = "프로젝트 연도", example = "2026")
        short year,

        @Schema(description = "프로젝트 한 줄 설명")
        String tagline,

        @Schema(description = "상세 Hero 프로젝트 요약", nullable = true)
        String summary,

        @Schema(description = "상세 Hero 역할", nullable = true)
        String detailRole,

        @Schema(description = "개발 시작일", example = "2026-04-27", nullable = true)
        LocalDate startedAt,

        @Schema(description = "개발 종료일", example = "2026-08-18", nullable = true)
        LocalDate endedAt,

        @Schema(description = "참여 인원", example = "9", nullable = true)
        Short teamSize,

        @Schema(description = "대표 이미지 경로", nullable = true)
        String thumbnailUrl,

        @Schema(description = "프로젝트 전체 기술")
        List<ProjectTechnologyResponse> technologies,

        @Schema(description = "프로젝트 고정 본문")
        ProjectContentResponse content,

        @Schema(description = "프로젝트 이미지 갤러리")
        List<ProjectMediaResponse> media
) {

    // 프로젝트 Entity와 상세 구성요소의 공개 응답 조합
    public static PublicProjectResponse from(
            Project project,
            List<ProjectTechnologyResponse> technologies,
            ProjectContentResponse content,
            List<ProjectMediaResponse> media
    ) {
        return new PublicProjectResponse(
                project.getId(),
                project.getSlug(),
                project.getName(),
                project.getYear(),
                project.getTagline(),
                project.getSummary(),
                project.getDetailRole(),
                project.getStartedAt(),
                project.getEndedAt(),
                project.getTeamSize(),
                project.getThumbnailUrl(),
                technologies,
                content,
                media
        );
    }
}
