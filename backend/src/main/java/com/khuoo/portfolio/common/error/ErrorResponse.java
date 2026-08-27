package com.khuoo.portfolio.common.error;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 공통 API 오류 응답
public record ErrorResponse(
        @Schema(description = "고정 오류 코드", example = "COMMON_VALIDATION_ERROR")
        String code,
        @Schema(description = "외부 노출용 안전한 오류 메시지", example = "입력값을 확인하세요.")
        String message,
        @Schema(description = "요청 추적 식별자")
        String traceId,
        @Schema(description = "필드 단위 검증 오류 목록")
        List<FieldErrorResponse> fieldErrors
) {

    public ErrorResponse {
        fieldErrors = fieldErrors == null ? List.of() : List.copyOf(fieldErrors);
    }

    public static ErrorResponse from(ErrorCode errorCode, String traceId) {
        return new ErrorResponse(errorCode.code(), errorCode.message(), traceId, List.of());
    }
}
