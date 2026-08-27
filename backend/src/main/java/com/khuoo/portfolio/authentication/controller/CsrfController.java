package com.khuoo.portfolio.authentication.controller;

import com.khuoo.portfolio.authentication.dto.CsrfResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// CSRF Token 조회 API
@RestController
@RequestMapping("/api/v1/auth")
public class CsrfController {

    // CSRF Token 조회
    @Operation(summary = "CSRF Token 조회")
    @ApiResponse(responseCode = "200", description = "CSRF Token 조회 성공")
    @GetMapping("/csrf")
    public CsrfResponse getCsrfToken(CsrfToken csrfToken) {
        return new CsrfResponse(csrfToken.getToken());
    }
}
