package com.khuoo.portfolio.account.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

// 관리자 계정 비밀번호 초기화 요청
public record AccountPasswordResetRequest(
        @Schema(description = "초기화할 새 비밀번호", example = "new-password", accessMode = Schema.AccessMode.WRITE_ONLY)
        @NotBlank(message = "새 비밀번호를 입력하세요.")
        @Size(min = 8, max = 64, message = "새 비밀번호는 8자 이상 64자 이하여야 합니다.")
        String newPassword
) {
}
