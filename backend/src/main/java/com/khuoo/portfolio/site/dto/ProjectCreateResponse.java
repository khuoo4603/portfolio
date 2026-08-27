package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.site.domain.Project;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;
import java.time.OffsetDateTime;

// 관리자 프로젝트 생성 응답
public record ProjectCreateResponse(
        @Schema(description = "프로젝트 식별자") Long id,
        @Schema(description = "공개 상세 Route slug") String slug,
        @Schema(description = "프로젝트명") String name,
        @Schema(description = "프로젝트 연도") short year,
        @Schema(description = "프로젝트 한 줄 설명") String tagline,
        @Schema(description = "프로젝트 카드 설명") String description,
        @Schema(description = "프로젝트 카드 역할") String cardRole,
        @Schema(description = "상세 Hero 요약", nullable = true) String summary,
        @Schema(description = "상세 Hero 역할", nullable = true) String detailRole,
        @Schema(description = "개발 시작일", nullable = true) LocalDate startedAt,
        @Schema(description = "개발 종료일", nullable = true) LocalDate endedAt,
        @Schema(description = "참여 인원", nullable = true) Short teamSize,
        @Schema(description = "대표 이미지 경로", nullable = true) String thumbnailUrl,
        @Schema(description = "표시 순서") int displayOrder,
        @Schema(description = "공개 활성 여부") boolean enabled,
        @Schema(description = "생성 시각") OffsetDateTime createdAt,
        @Schema(description = "마지막 수정 시각") OffsetDateTime updatedAt
) {

    // 프로젝트 Entity의 생성 응답 변환
    public static ProjectCreateResponse from(Project project) {
        return new ProjectCreateResponse(
                project.getId(),
                project.getSlug(),
                project.getName(),
                project.getYear(),
                project.getTagline(),
                project.getDescription(),
                project.getCardRole(),
                project.getSummary(),
                project.getDetailRole(),
                project.getStartedAt(),
                project.getEndedAt(),
                project.getTeamSize(),
                project.getThumbnailUrl(),
                project.getDisplayOrder(),
                project.isEnabled(),
                ResponseTime.kst(project.getCreatedAt()),
                ResponseTime.kst(project.getUpdatedAt())
        );
    }
}
