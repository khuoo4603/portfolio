package com.khuoo.portfolio.authentication.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.util.UUID;

// ADMIN_LOGIN 인증번호 검증 요청
public record AdminLoginVerifyRequest(
        @Schema(description = "ADMIN_LOGIN Challenge 식별자", example = "550e8400-e29b-41d4-a716-446655440000")
        @NotNull(message = "Challenge ID를 입력하세요.")
        UUID challengeId,

        @Schema(description = "이메일로 발송된 숫자 6자리 인증번호", example = "123456")
        @NotBlank(message = "인증번호를 입력하세요.")
        @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
        String code
) {
}
