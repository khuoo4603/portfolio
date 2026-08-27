package com.khuoo.portfolio.monitoring.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.ErrorService;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// Frontend HTTP 5xx 내부 기록 요청
public record ErrorLogRequest(
        @NotNull
        @Schema(description = "오류 발생 서비스", allowableValues = "FRONTEND")
        ErrorService service,

        @NotBlank
        @Size(max = 10)
        @Schema(description = "HTTP Method")
        String method,

        @NotBlank
        @Size(max = 1000)
        @Schema(description = "Query를 제외한 요청 경로")
        String path,

        @Min(500)
        @Max(599)
        @Schema(description = "HTTP 5xx 상태 코드")
        int statusCode,

        @Size(max = 100)
        @Schema(description = "애플리케이션 오류 코드", nullable = true)
        String errorCode,

        @NotBlank
        @Size(max = 500)
        @Schema(description = "관리자용 오류 요약")
        String message,

        @NotBlank
        @Size(max = 64)
        @Schema(description = "Frontend 오류 Trace ID")
        String traceId
) {
}
