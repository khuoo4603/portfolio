package com.khuoo.portfolio.monitoring.controller;

import com.khuoo.portfolio.common.util.PortfolioEnums.ErrorService;
import com.khuoo.portfolio.monitoring.domain.LoginResult;
import com.khuoo.portfolio.monitoring.dto.ErrorLogListResponse;
import com.khuoo.portfolio.monitoring.dto.LoginLogListResponse;
import com.khuoo.portfolio.monitoring.service.AdminLogService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.OffsetDateTime;

// ADMIN 전용 로그인·HTTP 5xx 기록 조회 API
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/logs")
public class AdminLogController {

    private final AdminLogService adminLogService;

    // 기간·이메일·결과 기반 로그인 기록 조회
    @Operation(summary = "로그인 기록 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "로그인 기록 조회 성공"),
            @ApiResponse(responseCode = "400", description = "조회 조건 오류"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음")
    })
    @GetMapping("/logins")
    public LoginLogListResponse findLogins(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(required = false) String email,
            @RequestParam(required = false) LoginResult result,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return adminLogService.findLogins(from, to, email, result, page, size);
    }

    // 기간·서비스·HTTP Status 기반 오류 기록 조회
    @Operation(summary = "5xx 오류 기록 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "오류 기록 조회 성공"),
            @ApiResponse(responseCode = "400", description = "조회 조건 오류"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음")
    })
    @GetMapping("/errors")
    public ErrorLogListResponse findErrors(
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false)
            @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(required = false) ErrorService service,
            @RequestParam(required = false) Integer statusCode,
            @RequestParam(required = false) Integer page,
            @RequestParam(required = false) Integer size
    ) {
        return adminLogService.findErrors(from, to, service, statusCode, page, size);
    }
}
