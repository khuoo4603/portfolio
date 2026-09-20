package com.khuoo.portfolio.monitoring.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// Monitoring 설정과 대상 통합 응답
public record AdminMonitoringResponse(
        @Schema(description = "Monitoring Runtime 설정")
        MonitoringSettingsResponse settings,

        @Schema(description = "표시 순서 기반 Monitoring 대상")
        List<MonitoringTargetResponse> targets
) {
}
