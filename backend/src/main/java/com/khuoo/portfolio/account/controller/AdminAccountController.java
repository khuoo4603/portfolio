package com.khuoo.portfolio.account.controller;

import com.khuoo.portfolio.account.dto.AccountCreateRequest;
import com.khuoo.portfolio.account.dto.AccountCreateResponse;
import com.khuoo.portfolio.account.dto.AccountPasswordResetRequest;
import com.khuoo.portfolio.account.dto.AccountRoleRequest;
import com.khuoo.portfolio.account.dto.AccountRoleResponse;
import com.khuoo.portfolio.account.dto.AccountStatusRequest;
import com.khuoo.portfolio.account.dto.AccountStatusResponse;
import com.khuoo.portfolio.account.dto.AdminAccountListResponse;
import com.khuoo.portfolio.account.service.AdminAccountService;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
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
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

// ADMIN 전용 계정 목록·생성·상태·권한·비밀번호 API
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/accounts")
public class AdminAccountController {

    private final AdminAccountService accountService;

    // 선택 조건 기반 계정 목록 조회
    @Operation(summary = "관리자 계정 목록 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "계정 목록 조회 성공"),
            @ApiResponse(responseCode = "400", description = "조회 조건 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음")
    })
    @GetMapping
    public AdminAccountListResponse findAll(
            @RequestParam(required = false) AccountRole role,
            @RequestParam(required = false) Boolean enabled,
            @RequestParam(required = false) String keyword
    ) {
        return accountService.findAll(role, enabled, keyword);
    }

    // 관리자 재인증 후 신규 계정 생성
    @Operation(summary = "관리자 계정 생성")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "계정 생성 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "409", description = "이메일 중복")
    })
    @PostMapping
    public ResponseEntity<AccountCreateResponse> create(
            @Valid @RequestBody AccountCreateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(accountService.create(request, currentAdmin, challengeId, code));
    }

    // 관리자 재인증 후 계정 활성 상태 변경
    @Operation(summary = "관리자 계정 활성 상태 변경")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "계정 상태 변경 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "계정 없음"),
            @ApiResponse(responseCode = "409", description = "마지막 ADMIN 보호")
    })
    @PatchMapping("/{accountId}/status")
    public AccountStatusResponse changeStatus(
            @PathVariable Long accountId,
            @Valid @RequestBody AccountStatusRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return accountService.changeStatus(accountId, request, currentAdmin, challengeId, code);
    }

    // 관리자 재인증 후 계정 권한 변경
    @Operation(summary = "관리자 계정 권한 변경")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "계정 권한 변경 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "계정 없음"),
            @ApiResponse(responseCode = "409", description = "마지막 ADMIN 보호")
    })
    @PatchMapping("/{accountId}/role")
    public AccountRoleResponse changeRole(
            @PathVariable Long accountId,
            @Valid @RequestBody AccountRoleRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return accountService.changeRole(accountId, request, currentAdmin, challengeId, code);
    }

    // 관리자 재인증 후 대상 계정 비밀번호 초기화
    @Operation(summary = "관리자 계정 비밀번호 초기화")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "비밀번호 초기화 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 또는 비밀번호 정책 위반"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "계정 없음")
    })
    @PatchMapping("/{accountId}/password")
    public ResponseEntity<Void> resetPassword(
            @PathVariable Long accountId,
            @Valid @RequestBody AccountPasswordResetRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        accountService.resetPassword(accountId, request, currentAdmin, challengeId, code);
        return ResponseEntity.noContent().build();
    }
}
