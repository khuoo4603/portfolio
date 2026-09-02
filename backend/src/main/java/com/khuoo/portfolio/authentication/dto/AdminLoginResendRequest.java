package com.khuoo.portfolio.authentication.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

// ADMIN_LOGIN 인증번호 재발송 요청
public record AdminLoginResendRequest(
        @Schema(description = "기존 ADMIN_LOGIN Challenge 식별자", example = "550e8400-e29b-41d4-a716-446655440000")
        @NotNull(message = "Challenge ID를 입력하세요.")
        UUID challengeId
) {
}
