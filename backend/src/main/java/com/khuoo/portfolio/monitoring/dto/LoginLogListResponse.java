package com.khuoo.portfolio.monitoring.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.LoginFailureReason;
import com.khuoo.portfolio.monitoring.domain.LoginResult;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.List;

// 관리자 로그인 기록 Pagination 응답
public record LoginLogListResponse(
        @Schema(description = "로그인 기록 목록") List<LoginLogItem> items,
        @Schema(description = "현재 Page") int page,
        @Schema(description = "Page 크기") int size,
        @Schema(description = "전체 기록 수") long totalElements
) {

    // 로그인 성공·실패 기록 항목
    public record LoginLogItem(
            @Schema(description = "로그인 기록 식별자") Long id,
            @Schema(description = "발생시각") OffsetDateTime occurredAt,
            @Schema(description = "로그인 시도 이메일") String email,
            @Schema(description = "로그인 결과") LoginResult result,
            @Schema(description = "실패 사유", nullable = true) LoginFailureReason failureReason,
            @Schema(description = "Client IP") String ip,
            @Schema(description = "Browser", nullable = true) String browser,
            @Schema(description = "운영체제", nullable = true) String os,
            @Schema(description = "기기 유형", nullable = true) String device,
            @Schema(description = "Trace ID") String traceId
    ) {
    }
}
