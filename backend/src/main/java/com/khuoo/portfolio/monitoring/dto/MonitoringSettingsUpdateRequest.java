package com.khuoo.portfolio.monitoring.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.JsonNode;

// 미전달 필드 구분 Monitoring 설정 수정 요청
public record MonitoringSettingsUpdateRequest(
        @Schema(description = "Monitoring 실행 여부", implementation = Boolean.class)
        JsonNode enabled,

        @Schema(description = "상태 확인 주기 초", implementation = Integer.class)
        JsonNode checkIntervalSeconds,

        @Schema(description = "연결 제한 시간 밀리초", implementation = Integer.class)
        JsonNode connectTimeoutMs,

        @Schema(description = "요청 제한 시간 밀리초", implementation = Integer.class)
        JsonNode requestTimeoutMs,

        @Schema(description = "재시도 대기 시간 밀리초", implementation = Integer.class)
        JsonNode retryDelayMs,

        @Schema(description = "최대 재시도 횟수", implementation = Integer.class)
        JsonNode maxRetries
) {
}
