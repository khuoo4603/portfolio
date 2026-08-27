package com.khuoo.portfolio.common.error;

import io.swagger.v3.oas.annotations.media.Schema;

// 요청 필드 단위 검증 오류 응답
public record FieldErrorResponse(
        @Schema(description = "검증 실패 필드명", example = "email")
        String field,
        @Schema(description = "검증 실패 메시지", example = "이메일 형식이 올바르지 않습니다.")
        String message
) {
}
