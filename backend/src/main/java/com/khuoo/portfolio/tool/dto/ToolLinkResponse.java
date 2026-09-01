package com.khuoo.portfolio.tool.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.ToolLinkCategory;
import com.khuoo.portfolio.tool.domain.ToolLink;
import io.swagger.v3.oas.annotations.media.Schema;

// 사용자 Tool Link 표시 정보 응답
public record ToolLinkResponse(
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
        ToolLinkCategory category
) {

    // Tool Link Entity의 사용자 응답 변환
    public static ToolLinkResponse from(ToolLink link) {
        return new ToolLinkResponse(
                link.getId(),
                link.getName(),
                link.getDescription(),
                link.getUrl(),
                link.getImageStorageKey(),
                link.getCategory()
        );
    }
}
