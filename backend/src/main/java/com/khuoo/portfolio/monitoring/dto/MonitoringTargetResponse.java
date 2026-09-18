package com.khuoo.portfolio.monitoring.dto;

import com.khuoo.portfolio.common.util.ResponseTime;
import com.khuoo.portfolio.monitoring.domain.MonitoringTarget;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// Monitoring 대상 응답
public record MonitoringTargetResponse(
        @Schema(description = "Target 식별자")
        Long id,

        @Schema(description = "변경 불가 서비스 Key", example = "PORTFOLIO_FRONTEND")
        String serviceKey,

        @Schema(description = "관리자 표시명")
        String displayName,

        @Schema(description = "HTTP GET Health URL", nullable = true)
        String healthUrl,

        @Schema(description = "Monitoring 활성 여부")
        boolean enabled,

        @Schema(description = "표시 순서")
        int displayOrder,

        @Schema(description = "생성 시각")
        OffsetDateTime createdAt,

        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {

    // Entity 기반 대상 응답 변환
    public static MonitoringTargetResponse from(MonitoringTarget target) {
        return new MonitoringTargetResponse(
                target.getId(),
                target.getServiceKey(),
                target.getDisplayName(),
                target.getHealthUrl(),
                target.isEnabled(),
                target.getDisplayOrder(),
                ResponseTime.kst(target.getCreatedAt()),
                ResponseTime.kst(target.getUpdatedAt())
        );
    }
}
