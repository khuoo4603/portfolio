package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;
import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.JsonNode;

// 기술 사전 항목의 미전달·명시적 null 구분 수정 요청
public record TechnologyUpdateRequest(
        @Schema(description = "기술명", implementation = String.class)
        JsonNode name,

        @Schema(description = "기술 분류", implementation = TechnologyCategory.class)
        JsonNode category,

        @Schema(description = "기술 아이콘 경로", implementation = String.class, nullable = true)
        JsonNode iconUrl,

        @Schema(description = "신규 연결 가능 여부", implementation = Boolean.class)
        JsonNode enabled
) {
}
