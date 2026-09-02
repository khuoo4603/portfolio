package com.khuoo.portfolio.account.dto;

import com.khuoo.portfolio.common.util.EmailNormalizer;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

// 관리자 계정 생성 요청
public record AccountCreateRequest(
        @Schema(description = "로그인 이메일", example = "user@example.com")
        @NotBlank(message = "이메일을 입력하세요.")
        @Email(message = "이메일 형식을 확인하세요.")
        @Size(max = 255, message = "이메일은 255자 이하여야 합니다.")
        String email,

        @Schema(description = "계정 이름", example = "홍길동")
        @NotBlank(message = "계정 이름을 입력하세요.")
        @Size(max = 100, message = "계정 이름은 100자 이하여야 합니다.")
        String name,

        @Schema(description = "초기 비밀번호", example = "initial-password", accessMode = Schema.AccessMode.WRITE_ONLY)
        @NotBlank(message = "초기 비밀번호를 입력하세요.")
        @Size(min = 8, max = 64, message = "초기 비밀번호는 8자 이상 64자 이하여야 합니다.")
        String password,

        @Schema(description = "계정 권한", example = "USER")
        @NotNull(message = "계정 권한을 입력하세요.")
        AccountRole role,

        @Schema(description = "계정 활성 여부", example = "true", defaultValue = "true")
        Boolean enabled
) {

    // Validation 전 이메일 비교·저장 기준 정규화
    public AccountCreateRequest {
        email = EmailNormalizer.normalize(email);
    }
}
