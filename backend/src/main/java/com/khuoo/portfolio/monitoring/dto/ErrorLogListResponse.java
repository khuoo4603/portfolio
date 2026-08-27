package com.khuoo.portfolio.monitoring.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.ErrorService;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.List;

// 관리자 HTTP 5xx 기록 Pagination 응답
public record ErrorLogListResponse(
        @Schema(description = "오류 기록 목록") List<ErrorLogItem> items,
        @Schema(description = "현재 Page") int page,
        @Schema(description = "Page 크기") int size,
        @Schema(description = "전체 기록 수") long totalElements
) {

    // HTTP 5xx 요약 기록 항목
    public record ErrorLogItem(
            @Schema(description = "오류 기록 식별자") Long id,
            @Schema(description = "발생시각") OffsetDateTime occurredAt,
            @Schema(description = "오류 발생 서비스") ErrorService service,
            @Schema(description = "HTTP Method", nullable = true) String method,
            @Schema(description = "Query를 제외한 요청 경로", nullable = true) String path,
            @Schema(description = "HTTP 상태 코드") int statusCode,
            @Schema(description = "애플리케이션 오류 코드", nullable = true) String errorCode,
            @Schema(description = "관리자용 오류 요약") String message,
            @Schema(description = "Trace ID") String traceId
    ) {
    }
}
