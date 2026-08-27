package com.khuoo.portfolio.authentication.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

// 이메일·비밀번호 로그인 요청
public record LoginRequest(
        @Schema(description = "로그인 이메일", example = "user@example.com")
        @NotBlank(message = "이메일을 입력하세요.")
        @Email(message = "이메일 형식이 올바르지 않습니다.")
        String email,

        @Schema(description = "로그인 비밀번호", example = "********", accessMode = Schema.AccessMode.WRITE_ONLY)
        @NotBlank(message = "비밀번호를 입력하세요.")
        String password,

        @Schema(description = "자동 로그인 여부", example = "false", defaultValue = "false")
        boolean rememberMe
) {
}
