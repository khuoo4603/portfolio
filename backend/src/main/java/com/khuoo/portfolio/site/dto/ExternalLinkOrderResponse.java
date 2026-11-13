package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 외부 링크 정렬 저장 후 확정된 순서 응답
public record ExternalLinkOrderResponse(
        @Schema(description = "확정된 외부 링크 순서")
        List<AdminExternalLinkResponse> items
) {
}
