package com.khuoo.portfolio.site.controller;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.site.dto.AdminSiteResponse;
import com.khuoo.portfolio.site.dto.PortfolioContentUpdateRequest;
import com.khuoo.portfolio.site.dto.PortfolioContentUpdateResponse;
import com.khuoo.portfolio.site.dto.PortfolioTechnologyReplaceRequest;
import com.khuoo.portfolio.site.dto.PortfolioTechnologyReplaceResponse;
import com.khuoo.portfolio.site.service.AdminSiteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

// ADMIN 전용 사이트 통합 조회와 고정·메인 구성 API
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/site")
public class AdminSiteController {

    private final AdminSiteService adminSiteService;

    // 비활성 데이터를 포함한 사이트 관리 데이터 통합 조회
    @Operation(summary = "사이트 관리 데이터 통합 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "사이트 관리 데이터 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음")
    })
    @GetMapping
    public AdminSiteResponse findSite() {
        return adminSiteService.findSite();
    }

    // 관리자 재인증 후 고정 콘텐츠 Batch 수정
    @Operation(summary = "포트폴리오 고정 콘텐츠 일괄 수정")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "고정 콘텐츠 수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "고정 콘텐츠 Slot 없음")
    })
    @PatchMapping("/portfolio-contents")
    public PortfolioContentUpdateResponse updateContents(
            @Valid @RequestBody PortfolioContentUpdateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return adminSiteService.updateContents(request, currentAdmin, challengeId, code);
    }

    // 관리자 재인증 후 메인 기술 구성 전체 교체
    @Operation(summary = "포트폴리오 메인 기술 스택 구성 저장")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "메인 기술 구성 저장 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "활성 기술 없음")
    })
    @PutMapping("/portfolio-technologies")
    public PortfolioTechnologyReplaceResponse replacePortfolioTechnologies(
            @Valid @RequestBody PortfolioTechnologyReplaceRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return adminSiteService.replacePortfolioTechnologies(request, currentAdmin, challengeId, code);
    }
}
