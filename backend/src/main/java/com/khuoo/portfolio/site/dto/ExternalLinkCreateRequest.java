package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

// 관리자 외부 링크 생성 요청
public record ExternalLinkCreateRequest(
        @NotBlank
        @Size(max = 100)
        @Schema(description = "링크 표시명", example = "GitHub")
        String name,

        @NotBlank
        @Schema(description = "HTTP 또는 HTTPS 외부 URL")
        String url,

        @PositiveOrZero
        @Schema(description = "표시 순서", defaultValue = "0")
        Integer displayOrder,

        @Schema(description = "공개 활성 여부", defaultValue = "true")
        Boolean enabled
) {
}
