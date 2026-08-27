package com.khuoo.portfolio.monitoring.controller;

import com.khuoo.portfolio.monitoring.dto.ErrorLogRequest;
import com.khuoo.portfolio.monitoring.service.ErrorLogService;
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

// Next.js Server 전용 Frontend HTTP 5xx 기록 API
@RestController
@RequiredArgsConstructor
@RequestMapping("/internal/v1/error-logs")
public class InternalErrorLogController {

    private final ErrorLogService errorLogService;

    // Frontend HTTP 5xx 요약 Best-effort 기록
    @Operation(summary = "Frontend 5xx 오류 기록")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "오류 기록 요청 처리 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패")
    })
    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void record(@Valid @RequestBody ErrorLogRequest request) {
        errorLogService.recordFrontend(request);
    }
}
