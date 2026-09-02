package com.khuoo.portfolio.authentication.controller;

import com.khuoo.portfolio.authentication.dto.AdminLoginResendRequest;
import com.khuoo.portfolio.authentication.dto.AdminLoginVerifyRequest;
import com.khuoo.portfolio.authentication.dto.ChallengeResponse;
import com.khuoo.portfolio.authentication.dto.CurrentUserResponse;
import com.khuoo.portfolio.authentication.dto.LoginRequest;
import com.khuoo.portfolio.authentication.dto.LoginResponse;
import com.khuoo.portfolio.authentication.dto.PasswordChangeRequest;
import com.khuoo.portfolio.authentication.service.AuthenticationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// USER·ADMIN 로그인과 본인 인증·계정 Session API
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    // USER Credential 검증과 Session 생성
    @Operation(summary = "이메일·비밀번호 로그인")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "USER 로그인 또는 ADMIN_LOGIN Challenge 발급 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "Credential 검증 실패"),
            @ApiResponse(responseCode = "429", description = "로그인 시도 제한"),
            @ApiResponse(responseCode = "503", description = "인증 이메일 발송 실패")
    })
    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        return authenticationService.login(loginRequest, request, response);
    }

    // ADMIN_LOGIN 인증번호 검증과 최종 Session 생성
    @Operation(summary = "ADMIN 로그인 이메일 인증번호 검증")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "ADMIN 로그인 완료"),
            @ApiResponse(responseCode = "400", description = "Challenge 사용 불가"),
            @ApiResponse(responseCode = "401", description = "인증번호 불일치"),
            @ApiResponse(responseCode = "410", description = "Challenge 만료"),
            @ApiResponse(responseCode = "423", description = "Challenge 잠김")
    })
    @PostMapping("/admin-login/verify")
    public LoginResponse verifyAdminLogin(
            @Valid @RequestBody AdminLoginVerifyRequest verifyRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        return authenticationService.verifyAdminLogin(verifyRequest, request, response);
    }

    // ADMIN_LOGIN 인증번호 재발송과 기존 Challenge 교체
    @Operation(summary = "ADMIN 로그인 인증번호 재발송")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "새 Challenge 발급 성공"),
            @ApiResponse(responseCode = "404", description = "기존 Challenge 없음"),
            @ApiResponse(responseCode = "409", description = "재발송 대기 또는 사용 불가"),
            @ApiResponse(responseCode = "429", description = "시간당 발송 제한"),
            @ApiResponse(responseCode = "503", description = "인증 이메일 발송 실패")
    })
    @PostMapping("/admin-login/resend")
    public ChallengeResponse resendAdminLogin(
            @Valid @RequestBody AdminLoginResendRequest resendRequest
    ) {
        return authenticationService.resendAdminLogin(resendRequest);
    }

    // 현재 Session과 SecurityContext 폐기
    @Operation(summary = "현재 Session 로그아웃")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "로그아웃 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "CSRF 검증 실패")
    })
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        authenticationService.logout(request, response, authentication);
        return ResponseEntity.noContent().build();
    }

    // 현재 로그인 계정 공개 정보 조회
    @Operation(summary = "현재 로그인 사용자 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "현재 사용자 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태")
    })
    @GetMapping("/me")
    public CurrentUserResponse getCurrentUser(Authentication authentication) {
        return authenticationService.getCurrentUser(authentication);
    }

    // 현재 로그인 계정 비밀번호 변경 Challenge 발급
    @Operation(summary = "본인 비밀번호 변경 인증번호 발송")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "PASSWORD_CHANGE Challenge 발급 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "429", description = "시간당 발송 제한"),
            @ApiResponse(responseCode = "503", description = "인증 이메일 발송 실패")
    })
    @PostMapping("/password/challenge")
    public ChallengeResponse issuePasswordChallenge(Authentication authentication) {
        return authenticationService.issuePasswordChallenge(authentication);
    }

    // PASSWORD_CHANGE 인증번호 검증과 전체 Session 폐기
    @Operation(summary = "본인 비밀번호 변경")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "비밀번호 변경 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 또는 비밀번호 정책 위반"),
            @ApiResponse(responseCode = "401", description = "비로그인 또는 인증번호 불일치"),
            @ApiResponse(responseCode = "410", description = "Challenge 만료"),
            @ApiResponse(responseCode = "423", description = "Challenge 잠김")
    })
    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(
            @Valid @RequestBody PasswordChangeRequest changeRequest,
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        authenticationService.changePassword(changeRequest, authentication, request, response);
        return ResponseEntity.noContent().build();
    }
}
