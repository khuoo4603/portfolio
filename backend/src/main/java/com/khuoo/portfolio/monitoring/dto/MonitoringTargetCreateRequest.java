package com.khuoo.portfolio.monitoring.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

// Monitoring 대상 생성 요청
public record MonitoringTargetCreateRequest(
        @NotBlank
        @Size(max = 100)
        @Pattern(regexp = "^[A-Z][A-Z0-9_]*$")
        @Schema(description = "변경 불가 서비스 Key", example = "NEW_SERVICE")
        String serviceKey,

        @NotBlank
        @Size(max = 100)
        @Schema(description = "관리자 표시명")
        String displayName,

        @Schema(description = "HTTP 또는 HTTPS Health URL", nullable = true)
        String healthUrl,

        @NotNull
        @Schema(description = "Monitoring 활성 여부")
        Boolean enabled,

        @NotNull
        @PositiveOrZero
        @Schema(description = "표시 순서")
        Integer displayOrder
) {
}
