package com.khuoo.portfolio.analytics.controller;

import com.khuoo.portfolio.analytics.dto.PageViewRequest;
import com.khuoo.portfolio.analytics.service.AnalyticsService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

// Next.js Server 전용 페이지 방문 집계 API
@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/v1/analytics")
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // 공개 페이지의 익명 방문 집계 기록
    @Operation(summary = "페이지 방문·조회 집계 기록")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "집계 요청 처리 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패")
    })
    @PostMapping("/page-view")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void record(@Valid @RequestBody PageViewRequest request) {
        analyticsService.record(request);
    }
}
