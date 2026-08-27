package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.JsonNode;

// 외부 링크의 미전달 필드 구분 수정 요청
public record ExternalLinkUpdateRequest(
        @Schema(description = "링크 표시명", implementation = String.class)
        JsonNode name,

        @Schema(description = "HTTP 또는 HTTPS 외부 URL", implementation = String.class)
        JsonNode url,

        @Schema(description = "표시 순서", implementation = Integer.class)
        JsonNode displayOrder,

        @Schema(description = "공개 활성 여부", implementation = Boolean.class)
        JsonNode enabled
) {
}
