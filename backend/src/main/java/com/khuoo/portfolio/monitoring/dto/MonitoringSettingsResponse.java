package com.khuoo.portfolio.monitoring.dto;

import com.khuoo.portfolio.common.util.ResponseTime;
import com.khuoo.portfolio.monitoring.domain.MonitoringSettings;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// Monitoring Runtime 설정 응답
public record MonitoringSettingsResponse(
        @Schema(description = "Monitoring 실행 여부")
        boolean enabled,

        @Schema(description = "상태 확인 주기 초")
        int checkIntervalSeconds,

        @Schema(description = "연결 제한 시간 밀리초")
        int connectTimeoutMs,

        @Schema(description = "요청 제한 시간 밀리초")
        int requestTimeoutMs,

        @Schema(description = "재시도 대기 시간 밀리초")
        int retryDelayMs,

        @Schema(description = "최대 재시도 횟수")
        int maxRetries,

        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {

    // Entity 기반 설정 응답 변환
    public static MonitoringSettingsResponse from(MonitoringSettings settings) {
        return new MonitoringSettingsResponse(
                settings.isEnabled(),
                settings.getCheckIntervalSeconds(),
                settings.getConnectTimeoutMs(),
                settings.getRequestTimeoutMs(),
                settings.getRetryDelayMs(),
                settings.getMaxRetries(),
                ResponseTime.kst(settings.getUpdatedAt())
        );
    }
}
