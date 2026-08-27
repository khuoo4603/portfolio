package com.khuoo.portfolio.site.controller;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.site.dto.ResumeUpdateResponse;
import com.khuoo.portfolio.site.service.ResumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.UUID;

// ADMIN 전용 현재 이력서 등록·교체 API
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/site/resume")
public class AdminResumeController {

    private final ResumeService resumeService;

    // 관리자 재인증 후 현재 이력서 PDF 등록·교체
    @Operation(summary = "이력서 PDF 등록·교체")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "이력서 등록·교체 성공"),
            @ApiResponse(responseCode = "400", description = "PDF 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "413", description = "파일 크기 초과")
    })
    @PutMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResumeUpdateResponse replace(
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return resumeService.replace(file, currentAdmin, challengeId, code);
    }
}
