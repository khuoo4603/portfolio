package com.khuoo.portfolio.monitoring.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.JsonNode;

// 미전달 필드 구분 Monitoring 대상 수정 요청
public record MonitoringTargetUpdateRequest(
        @Schema(description = "변경 불가 서비스 Key", implementation = String.class)
        JsonNode serviceKey,

        @Schema(description = "관리자 표시명", implementation = String.class)
        JsonNode displayName,

        @Schema(description = "HTTP 또는 HTTPS Health URL", implementation = String.class)
        JsonNode healthUrl,

        @Schema(description = "Monitoring 활성 여부", implementation = Boolean.class)
        JsonNode enabled,

        @Schema(description = "표시 순서", implementation = Integer.class)
        JsonNode displayOrder
) {
}
