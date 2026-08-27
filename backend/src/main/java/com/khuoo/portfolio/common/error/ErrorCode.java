package com.khuoo.portfolio.common.error;

import org.springframework.http.HttpStatus;

// 외부 노출용 공통 오류 코드
public enum ErrorCode {
    COMMON_VALIDATION_ERROR(HttpStatus.BAD_REQUEST, "입력값을 확인하세요."),
    COMMON_NOT_FOUND(HttpStatus.NOT_FOUND, "요청한 리소스를 찾을 수 없습니다."),
    COMMON_INTERNAL_ERROR(HttpStatus.INTERNAL_SERVER_ERROR, "요청 처리 중 오류가 발생했습니다."),
    AUTH_INVALID_CREDENTIALS(HttpStatus.UNAUTHORIZED, "이메일 또는 비밀번호를 확인하세요."),
    AUTH_RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "로그인 시도가 제한되었습니다. 잠시 후 다시 시도하세요."),
    AUTH_CHALLENGE_INVALID(HttpStatus.BAD_REQUEST, "사용할 수 없는 인증 요청입니다."),
    AUTH_CHALLENGE_NOT_FOUND(HttpStatus.NOT_FOUND, "인증 요청을 찾을 수 없습니다."),
    AUTH_CHALLENGE_CONFLICT(HttpStatus.CONFLICT, "인증 요청을 다시 사용할 수 없습니다."),
    AUTH_VERIFICATION_FAILED(HttpStatus.UNAUTHORIZED, "인증번호를 확인하세요."),
    AUTH_VERIFICATION_EXPIRED(HttpStatus.GONE, "인증번호가 만료되었습니다."),
    AUTH_VERIFICATION_LOCKED(HttpStatus.LOCKED, "인증 시도 횟수를 초과했습니다."),
    AUTH_RESEND_TOO_SOON(HttpStatus.CONFLICT, "인증번호 재발송은 잠시 후 다시 시도하세요."),
    AUTH_CHALLENGE_RATE_LIMITED(HttpStatus.TOO_MANY_REQUESTS, "인증번호 발송 횟수를 초과했습니다."),
    AUTH_MAIL_UNAVAILABLE(HttpStatus.SERVICE_UNAVAILABLE, "인증 이메일을 발송할 수 없습니다."),
    AUTH_ADMIN_ACTION_MISMATCH(HttpStatus.FORBIDDEN, "관리자 재인증 정보가 작업과 일치하지 않습니다."),
    AUTH_PASSWORD_POLICY(HttpStatus.BAD_REQUEST, "새 비밀번호 정책을 확인하세요."),
    AUTH_UNAUTHORIZED(HttpStatus.UNAUTHORIZED, "로그인이 필요합니다."),
    AUTH_FORBIDDEN(HttpStatus.FORBIDDEN, "접근 권한이 없습니다."),
    ACCOUNT_NOT_FOUND(HttpStatus.NOT_FOUND, "계정을 찾을 수 없습니다."),
    ACCOUNT_EMAIL_CONFLICT(HttpStatus.CONFLICT, "이미 사용 중인 이메일입니다."),
    ACCOUNT_LAST_ADMIN_PROTECTED(HttpStatus.CONFLICT, "마지막 활성 관리자 계정은 변경할 수 없습니다."),
    PROJECT_NOT_FOUND(HttpStatus.NOT_FOUND, "프로젝트를 찾을 수 없습니다."),
    SITE_CONTENT_NOT_FOUND(HttpStatus.NOT_FOUND, "포트폴리오 콘텐츠를 찾을 수 없습니다."),
    PROFILE_ENTRY_NOT_FOUND(HttpStatus.NOT_FOUND, "프로필 항목을 찾을 수 없습니다."),
    TECHNOLOGY_NOT_FOUND(HttpStatus.NOT_FOUND, "기술 항목을 찾을 수 없습니다."),
    TECHNOLOGY_NAME_CONFLICT(HttpStatus.CONFLICT, "이미 사용 중인 기술명입니다."),
    EXTERNAL_LINK_NOT_FOUND(HttpStatus.NOT_FOUND, "외부 링크를 찾을 수 없습니다."),
    TOOL_NOT_FOUND(HttpStatus.NOT_FOUND, "Tool을 찾을 수 없습니다."),
    TOOL_LINK_NOT_FOUND(HttpStatus.NOT_FOUND, "Tool Link를 찾을 수 없습니다."),
    PROJECT_SLUG_CONFLICT(HttpStatus.CONFLICT, "이미 사용 중인 프로젝트 slug입니다."),
    RESUME_NOT_FOUND(HttpStatus.NOT_FOUND, "등록된 이력서를 찾을 수 없습니다."),
    RESUME_FILE_TOO_LARGE(HttpStatus.PAYLOAD_TOO_LARGE, "이력서 파일 크기는 10MB 이하여야 합니다.");

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
