package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import tools.jackson.databind.JsonNode;

// Tool Link의 미전달 필드와 explicit null 구분 수정 요청
public record ToolLinkUpdateRequest(
        @Schema(description = "링크 표시명", implementation = String.class)
        JsonNode name,

        @Schema(description = "링크 설명", implementation = String.class, nullable = true)
        JsonNode description,

        @Schema(description = "HTTP 또는 HTTPS 외부 URL", implementation = String.class)
        JsonNode url,

        @NotNull
        @Schema(description = "대표 이미지 처리 방식", example = "KEEP")
        ToolLinkUpdateImageMode imageMode,

        @Schema(description = "링크 분류", implementation = String.class)
        JsonNode category,

        @Schema(description = "표시 순서", implementation = Integer.class)
        JsonNode displayOrder,

        @Schema(description = "공개 활성 여부", implementation = Boolean.class)
        JsonNode enabled
) {
}
