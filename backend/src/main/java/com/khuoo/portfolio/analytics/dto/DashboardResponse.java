package com.khuoo.portfolio.analytics.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.ServiceStatus;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;
import java.util.List;

// 관리자 대시보드 통합 응답
public record DashboardResponse(
        @Schema(description = "방문 통계")
        Traffic traffic,

        @Schema(description = "저장된 서비스 현재 상태")
        List<ServiceStatusItem> serviceStatus,

        @Schema(description = "사이트 운영 현황")
        SiteSummary siteSummary
) {

    // 오늘·이번 달·월별 방문 통계
    public record Traffic(
            @Schema(description = "오늘 방문자 수") long todayVisitors,
            @Schema(description = "오늘 페이지 조회 수") long todayPageViews,
            @Schema(description = "이번 달 방문자 수") long monthVisitors,
            @Schema(description = "이번 달 페이지 조회 수") long monthPageViews,
            @Schema(description = "과거부터 현재까지 월별 추이") List<Trend> trend
    ) {
    }

    // 월 단위 방문 추이
    public record Trend(
            @Schema(description = "집계 월", example = "2026-08") String month,
            @Schema(description = "월 방문자 수") long visitors,
            @Schema(description = "월 페이지 조회 수") long pageViews
    ) {
    }

    // 서비스 현재 상태 항목
    public record ServiceStatusItem(
            @Schema(description = "서비스 식별 Key") String serviceKey,
            @Schema(description = "현재 상태") ServiceStatus status,
            @Schema(description = "응답시간 밀리초", nullable = true) Integer responseTimeMs,
            @Schema(description = "HTTP 상태 코드", nullable = true) Integer httpStatus,
            @Schema(description = "마지막 확인시각") OffsetDateTime lastCheckedAt
    ) {
    }

    // 사이트 운영 대상별 활성 수
    public record SiteSummary(
            @Schema(description = "공개 프로젝트 수") long publicProjects,
            @Schema(description = "메인 연결 활성 기술 수") long portfolioTechnologies,
            @Schema(description = "활성 Tool 수") long activeTools,
            @Schema(description = "활성 계정 수") long activeAccounts
    ) {
    }
}
