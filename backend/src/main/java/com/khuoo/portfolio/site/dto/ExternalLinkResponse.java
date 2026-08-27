package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.site.domain.ExternalLink;
import io.swagger.v3.oas.annotations.media.Schema;

// 공개 외부 링크 응답
public record ExternalLinkResponse(
        @Schema(description = "외부 링크 식별자", example = "1")
        Long id,

        @Schema(description = "링크 표시명", example = "GitHub")
        String name,

        @Schema(description = "외부 Web URL", example = "https://github.com/example")
        String url,

        @Schema(description = "표시 순서", example = "1")
        int displayOrder
) {

    // 외부 링크 Entity의 공개 응답 변환
    public static ExternalLinkResponse from(ExternalLink link) {
        return new ExternalLinkResponse(
                link.getId(),
                link.getName(),
                link.getUrl(),
                link.getDisplayOrder()
        );
    }
}
