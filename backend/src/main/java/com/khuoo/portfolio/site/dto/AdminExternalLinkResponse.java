package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.ResponseTime;
import com.khuoo.portfolio.site.domain.ExternalLink;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 외부 링크 전체 값 응답
public record AdminExternalLinkResponse(
        @Schema(description = "외부 링크 식별자", example = "1")
        Long id,

        @Schema(description = "링크 표시명", example = "GitHub")
        String name,

        @Schema(description = "HTTP 또는 HTTPS 외부 URL")
        String url,

        @Schema(description = "표시 순서")
        int displayOrder,

        @Schema(description = "공개 활성 여부")
        boolean enabled,

        @Schema(description = "생성 시각")
        OffsetDateTime createdAt,

        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {

    // 외부 링크 Entity의 관리자 응답 변환
    public static AdminExternalLinkResponse from(ExternalLink link) {
        return new AdminExternalLinkResponse(
                link.getId(),
                link.getName(),
                link.getUrl(),
                link.getDisplayOrder(),
                link.isEnabled(),
                ResponseTime.kst(link.getCreatedAt()),
                ResponseTime.kst(link.getUpdatedAt())
        );
    }
}
