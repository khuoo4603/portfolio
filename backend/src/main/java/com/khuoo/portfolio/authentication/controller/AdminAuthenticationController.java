package com.khuoo.portfolio.authentication.controller;

import com.khuoo.portfolio.authentication.dto.AdminActionChallengeRequest;
import com.khuoo.portfolio.authentication.dto.ChallengeResponse;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.VerificationChallengeService;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 현재 ADMIN 계정의 변경 작업 재인증 Challenge API
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/auth")
public class AdminAuthenticationController {

    private final VerificationChallengeService challengeService;

    // 현재 ADMIN과 operation·target이 바인딩된 Challenge 발급
    @Operation(summary = "관리자 변경 작업 재인증번호 발송")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "ADMIN_ACTION Challenge 발급 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음"),
            @ApiResponse(responseCode = "429", description = "시간당 발송 제한"),
            @ApiResponse(responseCode = "503", description = "인증 이메일 발송 실패")
    })
    @PostMapping("/challenges")
    public ChallengeResponse issueChallenge(
            @Valid @RequestBody AdminActionChallengeRequest request,
            Authentication authentication
    ) {
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AccountPrincipal principal)) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED);
        }
        return challengeService.issueAdminAction(principal.id(), request);
    }
}
