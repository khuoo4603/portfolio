package com.khuoo.portfolio.authentication.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 현재 ADMIN 세션의 관리자 작업 재인증 유예 상태
public record AdminActionGraceResponse(
        @Schema(description = "현재 세션의 관리자 작업 재인증 유예 유효 여부")
        boolean verified,
        @Schema(description = "유예 만료 시각", nullable = true)
        OffsetDateTime expiresAt
) {
}
