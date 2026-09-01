package com.khuoo.portfolio.tool.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.ToolLinkCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

// 관리자 Tool Link 생성 요청
public record ToolLinkCreateRequest(
        @NotBlank
        @Size(max = 100)
        @Schema(description = "링크 표시명", example = "Spring Docs")
        String name,

        @Size(max = 500)
        @Schema(description = "링크 설명", nullable = true)
        String description,

        @NotBlank
        @Schema(description = "HTTP 또는 HTTPS 외부 URL")
        String url,

        @NotNull
        @Schema(description = "대표 이미지 처리 방식", example = "DEFAULT")
        ToolLinkCreateImageMode imageMode,

        @NotNull
        @Schema(description = "링크 분류", example = "REFERENCE")
        ToolLinkCategory category,

        @PositiveOrZero
        @Schema(description = "표시 순서", defaultValue = "0")
        Integer displayOrder,

        @Schema(description = "공개 활성 여부", defaultValue = "true")
        Boolean enabled
) {
}
