package com.khuoo.portfolio.common.error;

import java.util.List;

// 업무 및 애플리케이션 공통 예외
public class ApiException extends RuntimeException {

    private final ErrorCode errorCode;
    private final List<FieldErrorResponse> fieldErrors;

    public ApiException(ErrorCode errorCode) {
        super(errorCode.message());
        this.errorCode = errorCode;
        this.fieldErrors = List.of();
    }

    public ApiException(ErrorCode errorCode, Throwable cause) {
        super(errorCode.message(), cause);
        this.errorCode = errorCode;
        this.fieldErrors = List.of();
    }

    public ApiException(ErrorCode errorCode, List<FieldErrorResponse> fieldErrors) {
        super(errorCode.message());
        this.errorCode = errorCode;
        this.fieldErrors = List.copyOf(fieldErrors);
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }

    public List<FieldErrorResponse> getFieldErrors() {
        return fieldErrors;
    }
}
