package com.khuoo.portfolio.monitoring.controller;

import com.khuoo.portfolio.monitoring.dto.AdminMonitoringResponse;
import com.khuoo.portfolio.monitoring.dto.MonitoringSettingsResponse;
import com.khuoo.portfolio.monitoring.dto.MonitoringSettingsUpdateRequest;
import com.khuoo.portfolio.monitoring.dto.MonitoringTargetCreateRequest;
import com.khuoo.portfolio.monitoring.dto.MonitoringTargetResponse;
import com.khuoo.portfolio.monitoring.dto.MonitoringTargetUpdateRequest;
import com.khuoo.portfolio.monitoring.service.AdminMonitoringService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// ADMIN 전용 Monitoring 설정과 대상 관리 API
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/monitoring")
public class AdminMonitoringController {

    private final AdminMonitoringService adminMonitoringService;

    // Monitoring 설정과 대상 통합 조회
    @Operation(summary = "Monitoring 설정과 대상 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Monitoring 관리 정보 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음")
    })
    @GetMapping
    public AdminMonitoringResponse findAll() {
        return adminMonitoringService.findAll();
    }

    // Monitoring Runtime 설정 수정
    @Operation(summary = "Monitoring 설정 수정")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Monitoring 설정 수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음")
    })
    @PatchMapping("/settings")
    public MonitoringSettingsResponse updateSettings(
            @Valid @RequestBody MonitoringSettingsUpdateRequest request
    ) {
        return adminMonitoringService.updateSettings(request);
    }

    // Monitoring 대상 생성
    @Operation(summary = "Monitoring 대상 추가")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Monitoring 대상 생성 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음"),
            @ApiResponse(responseCode = "409", description = "Service Key 중복")
    })
    @PostMapping("/targets")
    public ResponseEntity<MonitoringTargetResponse> createTarget(
            @Valid @RequestBody MonitoringTargetCreateRequest request
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminMonitoringService.createTarget(request));
    }

    // Monitoring 대상 수정
    @Operation(summary = "Monitoring 대상 수정")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Monitoring 대상 수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청 값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음"),
            @ApiResponse(responseCode = "404", description = "Monitoring 대상 없음")
    })
    @PatchMapping("/targets/{targetId}")
    public MonitoringTargetResponse updateTarget(
            @PathVariable Long targetId,
            @Valid @RequestBody MonitoringTargetUpdateRequest request
    ) {
        return adminMonitoringService.updateTarget(targetId, request);
    }
}
