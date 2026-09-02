package com.khuoo.portfolio.project.dto;

import com.khuoo.portfolio.project.domain.ProjectMedia;
import io.swagger.v3.oas.annotations.media.Schema;

// 공개 프로젝트 이미지 갤러리 응답
public record ProjectMediaResponse(
        @Schema(description = "프로젝트 미디어 식별자", example = "1")
        Long id,

        @Schema(description = "Backend 미디어 조회 URL")
        String imageUrl,

        @Schema(description = "관리용 이미지 Label", nullable = true)
        String label,

        @Schema(description = "이미지 대체 텍스트", nullable = true)
        String altText,

        @Schema(description = "표시 순서", example = "1")
        int displayOrder
) {

    // 프로젝트 미디어 Entity의 관리자 응답 변환
    public static ProjectMediaResponse fromAdmin(ProjectMedia media) {
        return new ProjectMediaResponse(
                media.getId(),
                ProjectMediaUrl.adminMedia(media),
                media.getLabel(),
                media.getAltText(),
                media.getDisplayOrder()
        );
    }

    // 프로젝트 미디어 Entity의 공개 응답 변환
    public static ProjectMediaResponse fromPublic(ProjectMedia media) {
        return new ProjectMediaResponse(
                media.getId(),
                ProjectMediaUrl.publicMedia(media),
                media.getLabel(),
                media.getAltText(),
                media.getDisplayOrder()
        );
    }
}
