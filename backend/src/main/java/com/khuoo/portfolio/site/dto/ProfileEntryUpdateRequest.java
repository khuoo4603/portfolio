package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.ProfileEntryType;
import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.JsonNode;

// 프로필 항목의 미전달·명시적 null 구분 수정 요청
public record ProfileEntryUpdateRequest(
        @Schema(description = "프로필 항목 유형", implementation = ProfileEntryType.class)
        JsonNode entryType,

        @Schema(description = "기간 표시 문구", implementation = String.class, nullable = true)
        JsonNode periodText,

        @Schema(description = "항목 제목", implementation = String.class)
        JsonNode title,

        @Schema(description = "소속 또는 주관 기관", implementation = String.class, nullable = true)
        JsonNode organization,

        @Schema(description = "역할 또는 담당", implementation = String.class, nullable = true)
        JsonNode role,

        @Schema(description = "주요 설명", implementation = String.class, nullable = true)
        JsonNode description,

        @Schema(description = "주요 성과", implementation = String.class, nullable = true)
        JsonNode achievement,

        @Schema(description = "대표 강조 여부", implementation = Boolean.class)
        JsonNode featured,

        @Schema(description = "표시 순서", implementation = Integer.class)
        JsonNode displayOrder,

        @Schema(description = "공개 활성 여부", implementation = Boolean.class)
        JsonNode enabled
) {
}
