package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// 관리자 기술 사전 항목 생성 요청
public record TechnologyCreateRequest(
        @NotBlank
        @Size(max = 100)
        @Schema(description = "기술명", example = "Spring Boot")
        String name,

        @NotNull
        @Schema(description = "기술 분류", example = "BACKEND")
        TechnologyCategory category,

        @Schema(description = "기술 아이콘 경로", nullable = true)
        String iconUrl,

        @Schema(description = "신규 연결 가능 여부", defaultValue = "true")
        Boolean enabled
) {
}
