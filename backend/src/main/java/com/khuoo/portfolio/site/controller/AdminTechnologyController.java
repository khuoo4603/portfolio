package com.khuoo.portfolio.site.controller;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.site.dto.TechnologyCreateRequest;
import com.khuoo.portfolio.site.dto.TechnologyMasterResponse;
import com.khuoo.portfolio.site.dto.TechnologyUpdateRequest;
import com.khuoo.portfolio.site.service.AdminTechnologyService;
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

// ADMIN 전용 기술 사전 CRUD API
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/site/technologies")
public class AdminTechnologyController {

    private final AdminTechnologyService adminTechnologyService;

    // 관리자 재인증 후 기술 사전 항목 생성
    @Operation(summary = "기술 스택 마스터 추가")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "기술 생성 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "409", description = "기술명 중복")
    })
    @PostMapping
    public ResponseEntity<TechnologyMasterResponse> create(
            @Valid @RequestBody TechnologyCreateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminTechnologyService.create(request, currentAdmin, challengeId, code));
    }

    // 관리자 재인증 후 전달 필드 기반 기술 사전 항목 수정
    @Operation(summary = "기술 스택 마스터 수정")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "기술 수정 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "기술 없음"),
            @ApiResponse(responseCode = "409", description = "기술명 중복")
    })
    @PatchMapping("/{technologyId}")
    public TechnologyMasterResponse update(
            @PathVariable Long technologyId,
            @Valid @RequestBody TechnologyUpdateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return adminTechnologyService.update(technologyId, request, currentAdmin, challengeId, code);
    }

    // 관리자 재인증 후 FK Cascade 기반 기술 사전 항목 삭제
    @Operation(summary = "기술 스택 마스터 삭제")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "기술 삭제 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "기술 없음")
    })
    @DeleteMapping("/{technologyId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long technologyId,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        adminTechnologyService.delete(technologyId, currentAdmin, challengeId, code);
        return ResponseEntity.noContent().build();
    }
}
