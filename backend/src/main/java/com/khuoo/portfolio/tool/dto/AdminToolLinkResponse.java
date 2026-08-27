package com.khuoo.portfolio.tool.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.ToolLinkCategory;
import com.khuoo.portfolio.tool.domain.ToolLink;
import io.swagger.v3.oas.annotations.media.Schema;

// 관리자 Tool Link 전체 API 값 응답
public record AdminToolLinkResponse(
        @Schema(description = "Tool Link 식별자", example = "1")
        Long id,

        @Schema(description = "링크 표시명", example = "Spring Docs")
        String name,

        @Schema(description = "링크 설명", nullable = true)
        String description,

        @Schema(description = "HTTP 또는 HTTPS 외부 URL")
        String url,

        @Schema(description = "대표 이미지 경로 또는 URL", nullable = true)
        String imageUrl,

        @Schema(description = "링크 분류", example = "REFERENCE")
        ToolLinkCategory category,

        @Schema(description = "표시 순서")
        int displayOrder,

        @Schema(description = "공개 활성 여부")
        boolean enabled
) {

    // Tool Link Entity의 관리자 응답 변환
    public static AdminToolLinkResponse from(ToolLink link) {
        return new AdminToolLinkResponse(
                link.getId(),
                link.getName(),
                link.getDescription(),
                link.getUrl(),
                link.getImageUrl(),
                link.getCategory(),
                link.getDisplayOrder(),
                link.isEnabled()
        );
    }
}
