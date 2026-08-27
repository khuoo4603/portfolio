package com.khuoo.portfolio.authentication.controller;

import com.khuoo.portfolio.authentication.dto.CurrentUserResponse;
import com.khuoo.portfolio.authentication.dto.LoginRequest;
import com.khuoo.portfolio.authentication.dto.LoginResponse;
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
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// USER 로그인·로그아웃·현재 계정 API
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/auth")
public class AuthenticationController {

    private final AuthenticationService authenticationService;

    // USER Credential 검증과 Session 생성
    @Operation(summary = "이메일·비밀번호 로그인")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "USER 로그인 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "Credential 검증 실패"),
            @ApiResponse(responseCode = "429", description = "로그인 시도 제한"),
            @ApiResponse(responseCode = "503", description = "ADMIN 이메일 인증 단계 미완료")
    })
    @PostMapping("/login")
    public LoginResponse login(
            @Valid @RequestBody LoginRequest loginRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        return authenticationService.login(loginRequest, request, response);
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
}
