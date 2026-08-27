package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.JsonNode;

// 프로젝트 기본정보의 미전달·명시적 null 구분 수정 요청
public record ProjectUpdateRequest(
        @Schema(description = "공개 상세 Route slug", implementation = String.class) JsonNode slug,
        @Schema(description = "프로젝트명", implementation = String.class) JsonNode name,
        @Schema(description = "프로젝트 연도", implementation = Short.class) JsonNode year,
        @Schema(description = "프로젝트 한 줄 설명", implementation = String.class) JsonNode tagline,
        @Schema(description = "프로젝트 카드 설명", implementation = String.class) JsonNode description,
        @Schema(description = "프로젝트 카드 역할", implementation = String.class) JsonNode cardRole,
        @Schema(description = "상세 Hero 요약", implementation = String.class, nullable = true) JsonNode summary,
        @Schema(description = "상세 Hero 역할", implementation = String.class, nullable = true) JsonNode detailRole,
        @Schema(description = "개발 시작일", implementation = String.class, nullable = true) JsonNode startedAt,
        @Schema(description = "개발 종료일", implementation = String.class, nullable = true) JsonNode endedAt,
        @Schema(description = "참여 인원", implementation = Short.class, nullable = true) JsonNode teamSize,
        @Schema(description = "대표 이미지 경로", implementation = String.class, nullable = true) JsonNode thumbnailUrl,
        @Schema(description = "표시 순서", implementation = Integer.class) JsonNode displayOrder
) {
}
