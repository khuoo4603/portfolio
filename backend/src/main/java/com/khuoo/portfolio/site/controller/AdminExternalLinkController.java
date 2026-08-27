package com.khuoo.portfolio.site.controller;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.site.dto.AdminExternalLinkResponse;
import com.khuoo.portfolio.site.dto.ExternalLinkCreateRequest;
import com.khuoo.portfolio.site.dto.ExternalLinkUpdateRequest;
import com.khuoo.portfolio.site.service.AdminExternalLinkService;
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
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

// ADMIN 전용 포트폴리오 외부 링크 CRUD API
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/site/external-links")
public class AdminExternalLinkController {

    private final AdminExternalLinkService adminExternalLinkService;

    // 관리자 재인증 후 외부 링크 생성
    @Operation(summary = "포트폴리오 외부 링크 추가")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "외부 링크 생성 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 또는 URL 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패")
    })
    @PostMapping
    public ResponseEntity<AdminExternalLinkResponse> create(
            @Valid @RequestBody ExternalLinkCreateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminExternalLinkService.create(request, currentAdmin, challengeId, code));
    }

    // 관리자 재인증 후 전달 필드 기반 외부 링크 수정
    @Operation(summary = "포트폴리오 외부 링크 수정")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "외부 링크 수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 또는 URL 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "외부 링크 없음")
    })
    @PatchMapping("/{linkId}")
    public AdminExternalLinkResponse update(
            @PathVariable Long linkId,
            @Valid @RequestBody ExternalLinkUpdateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return adminExternalLinkService.update(linkId, request, currentAdmin, challengeId, code);
    }

    // 관리자 재인증 후 외부 링크 삭제
    @Operation(summary = "포트폴리오 외부 링크 삭제")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "외부 링크 삭제 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "외부 링크 없음")
    })
    @DeleteMapping("/{linkId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long linkId,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        adminExternalLinkService.delete(linkId, currentAdmin, challengeId, code);
        return ResponseEntity.noContent().build();
    }
}
