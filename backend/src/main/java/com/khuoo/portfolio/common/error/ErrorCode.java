package com.khuoo.portfolio.common.error;

import org.springframework.http.HttpStatus;

// 외부 노출용 공통 오류 코드
public enum ErrorCode {
    COMMON_VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "입력값을 확인하세요."),
    COMMON_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다."),
    COMMON_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "요청 처리 중 오류가 발생했습니다."),
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호를 확인하세요."),
    AUTH_RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "로그인 시도가 제한되었습니다. 잠시 후 다시 시도하세요."),
    AUTH_ADMIN_VERIFICATION_UNAVAILABLE(
            HttpStatus.SERVICE_UNAVAILABLE,
            "관리자 이메일 인증을 현재 사용할 수 없습니다."
    ),
    AUTH_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    AUTH_FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");

    private final HttpStatus status;
    private final String message;

    ErrorCode(HttpStatus status, String message) {
        this.status = status;
        this.message = message;
    }

    public String code() {
        return name();
    }

    public HttpStatus status() {
        return status;
    }

    public String message() {
        return message;
    }
}
