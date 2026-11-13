package com.khuoo.portfolio.monitoring.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// Monitoring 대상 정렬 저장 후 확정된 순서 응답
public record MonitoringTargetOrderResponse(
        @Schema(description = "확정된 Monitoring 대상 순서")
        List<MonitoringTargetResponse> items
) {
}
