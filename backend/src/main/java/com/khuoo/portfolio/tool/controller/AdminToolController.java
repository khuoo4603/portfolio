package com.khuoo.portfolio.tool.controller;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.tool.dto.AdminToolLinkResponse;
import com.khuoo.portfolio.tool.dto.AdminToolsResponse;
import com.khuoo.portfolio.tool.dto.ToolLinkCreateRequest;
import com.khuoo.portfolio.tool.dto.ToolLinkUpdateRequest;
import com.khuoo.portfolio.tool.dto.ToolStatusRequest;
import com.khuoo.portfolio.tool.dto.ToolStatusResponse;
import com.khuoo.portfolio.tool.service.AdminToolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

// ADMIN 전용 Tool Registry와 Tool Link 관리 API
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/tools")
public class AdminToolController {

    private final AdminToolService adminToolService;

    // 비활성 항목을 포함한 Tool Registry와 Links 통합 조회
    @Operation(summary = "Tools 관리 데이터 통합 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tools 관리 데이터 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음")
    })
    @GetMapping
    public AdminToolsResponse findAll() {
        return adminToolService.findAll();
    }

    // 관리자 재인증 후 Tool 활성 상태 변경
    @Operation(summary = "Tool 활성 ON/OFF")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tool 활성 상태 변경 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "Tool 없음")
    })
    @PatchMapping("/{toolKey}")
    public ToolStatusResponse changeStatus(
            @PathVariable String toolKey,
            @Valid @RequestBody ToolStatusRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return adminToolService.changeStatus(toolKey, request, currentAdmin, challengeId, code);
    }

    // 관리자 재인증 후 Tool Link 생성
    @Operation(summary = "Tool Link 추가")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Tool Link 생성 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 또는 URL 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패")
    })
    @PostMapping("/links")
    public ResponseEntity<AdminToolLinkResponse> createLink(
            @Valid @RequestBody ToolLinkCreateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminToolService.createLink(request, currentAdmin, challengeId, code));
    }

    // 관리자 재인증 후 전달 필드 기반 Tool Link 수정
    @Operation(summary = "Tool Link 수정")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tool Link 수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 또는 URL 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "Tool Link 없음")
    })
    @PatchMapping("/links/{linkId}")
    public AdminToolLinkResponse updateLink(
            @PathVariable Long linkId,
            @Valid @RequestBody ToolLinkUpdateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return adminToolService.updateLink(linkId, request, currentAdmin, challengeId, code);
    }

    // 관리자 재인증 후 Tool Link 삭제
    @Operation(summary = "Tool Link 삭제")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Tool Link 삭제 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "Tool Link 없음")
    })
    @DeleteMapping("/links/{linkId}")
    public ResponseEntity<Void> deleteLink(
            @PathVariable Long linkId,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        adminToolService.deleteLink(linkId, currentAdmin, challengeId, code);
        return ResponseEntity.noContent().build();
    }
}
