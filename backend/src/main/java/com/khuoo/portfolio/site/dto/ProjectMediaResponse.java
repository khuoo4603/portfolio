package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.site.domain.ProjectMedia;
import io.swagger.v3.oas.annotations.media.Schema;

// 공개 프로젝트 이미지 갤러리 응답
public record ProjectMediaResponse(
        @Schema(description = "프로젝트 미디어 식별자", example = "1")
        Long id,

        @Schema(description = "이미지 경로 또는 URL")
        String imageUrl,

        @Schema(description = "관리용 이미지 Label", nullable = true)
        String label,

        @Schema(description = "이미지 대체 텍스트", nullable = true)
        String altText,

        @Schema(description = "표시 순서", example = "1")
        int displayOrder
) {

    // 프로젝트 미디어 Entity의 공개 응답 변환
    public static ProjectMediaResponse from(ProjectMedia media) {
        return new ProjectMediaResponse(
                media.getId(),
                media.getImageUrl(),
                media.getLabel(),
                media.getAltText(),
                media.getDisplayOrder()
        );
    }
}
