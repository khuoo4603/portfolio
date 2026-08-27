package com.khuoo.portfolio.analytics.controller;

import com.khuoo.portfolio.analytics.dto.DashboardResponse;
import com.khuoo.portfolio.analytics.service.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

// ADMIN 전용 운영 대시보드 API
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/dashboard")
public class AdminDashboardController {

    private final DashboardService dashboardService;

    // 방문 통계와 서비스·사이트 현황 통합 조회
    @Operation(summary = "관리자 대시보드 통합 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "대시보드 조회 성공"),
            @ApiResponse(responseCode = "400", description = "조회 월 범위 오류"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음")
    })
    @GetMapping
    public DashboardResponse find(
            @RequestParam(defaultValue = "6") int months
    ) {
        return dashboardService.find(months);
    }
}
