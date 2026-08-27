package com.khuoo.portfolio.common.error;

import com.khuoo.portfolio.common.logging.TraceContext;
import jakarta.servlet.http.HttpServletRequest;
import org.hibernate.exception.ConstraintViolationException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.servlet.resource.NoResourceFoundException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.util.List;

// 공통 API 예외 응답 처리
@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    // 업무 예외의 고정 오류 응답 변환
    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(
            ApiException exception,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = exception.getErrorCode();
        return ResponseEntity.status(errorCode.status())
                .body(ErrorResponse.from(errorCode, TraceContext.get(request)));
    }

    // Request Body 필드 검증 오류 변환
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(
            MethodArgumentNotValidException exception,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> fieldErrors = exception.getBindingResult().getFieldErrors().stream()
                .map(this::toFieldError)
                .toList();
        return validationResponse(fieldErrors, request);
    }

    // Controller Method 파라미터 검증 오류 변환
    @ExceptionHandler(HandlerMethodValidationException.class)
    public ResponseEntity<ErrorResponse> handleMethodValidation(
            HandlerMethodValidationException exception,
            HttpServletRequest request
    ) {
        List<FieldErrorResponse> fieldErrors = exception.getParameterValidationResults().stream()
                .flatMap(result -> result.getResolvableErrors().stream()
                        .map(error -> new FieldErrorResponse(
                                result.getMethodParameter().getParameterName(),
                                error.getDefaultMessage()
                        )))
                .toList();
        return validationResponse(fieldErrors, request);
    }

    // 해석 불가능한 Request Body 오류 변환
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleUnreadableBody(
            HttpMessageNotReadableException exception,
            HttpServletRequest request
    ) {
        return validationResponse(List.of(), request);
    }

    // Query·Path·Header 형식 변환 오류 처리
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<ErrorResponse> handleTypeMismatch(
            MethodArgumentTypeMismatchException exception,
            HttpServletRequest request
    ) {
        return validationResponse(List.of(), request);
    }

    // 필수 Header·요청 파라미터 누락 오류 처리
    @ExceptionHandler(ServletRequestBindingException.class)
    public ResponseEntity<ErrorResponse> handleRequestBinding(
            ServletRequestBindingException exception,
            HttpServletRequest request
    ) {
        return validationResponse(List.of(), request);
    }

    // 등록되지 않은 Route의 404 공통 오류 변환
    @ExceptionHandler(NoResourceFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(
            NoResourceFoundException exception,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = ErrorCode.COMMON_NOT_FOUND;
        return ResponseEntity.status(errorCode.status())
                .body(ErrorResponse.from(errorCode, TraceContext.get(request)));
    }

    // Multipart 최대 크기 초과 오류의 413 응답 변환
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(
            MaxUploadSizeExceededException exception,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = ErrorCode.RESUME_FILE_TOO_LARGE;
        return ResponseEntity.status(errorCode.status())
                .body(ErrorResponse.from(errorCode, TraceContext.get(request)));
    }

    // 프로젝트 slug UNIQUE 경합의 409 응답 변환
    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(
            DataIntegrityViolationException exception,
            HttpServletRequest request
    ) {
        if (hasConstraint(exception, "uq_projects_slug")) {
            ErrorCode errorCode = ErrorCode.PROJECT_SLUG_CONFLICT;
            return ResponseEntity.status(errorCode.status())
                    .body(ErrorResponse.from(errorCode, TraceContext.get(request)));
        }
        return handleUnexpected(exception, request);
    }

    // 예상하지 못한 서버 오류의 안전한 응답 및 원인 기록
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleUnexpected(
            Exception exception,
            HttpServletRequest request
    ) {
        String traceId = TraceContext.get(request);
        log.error("service=backend traceId={} message=\"처리되지 않은 예외 발생\"", traceId, exception);
        ErrorCode errorCode = ErrorCode.COMMON_INTERNAL_ERROR;
        return ResponseEntity.status(errorCode.status())
                .body(ErrorResponse.from(errorCode, traceId));
    }

    private ResponseEntity<ErrorResponse> validationResponse(
            List<FieldErrorResponse> fieldErrors,
            HttpServletRequest request
    ) {
        ErrorCode errorCode = ErrorCode.COMMON_VALIDATION_ERROR;
        ErrorResponse response = new ErrorResponse(
                errorCode.code(),
                errorCode.message(),
                TraceContext.get(request),
                fieldErrors
        );
        return ResponseEntity.status(errorCode.status()).body(response);
    }

    private FieldErrorResponse toFieldError(FieldError error) {
        return new FieldErrorResponse(error.getField(), safeMessage(error));
    }

    private String safeMessage(MessageSourceResolvable error) {
        return error.getDefaultMessage() == null ? "올바른 값을 입력하세요." : error.getDefaultMessage();
    }

    private boolean hasConstraint(Throwable throwable, String expectedName) {
        Throwable current = throwable;
        while (current != null) {
            if (current instanceof ConstraintViolationException constraint
                    && expectedName.equalsIgnoreCase(constraint.getConstraintName())) {
                return true;
            }
            current = current.getCause();
        }
        return false;
    }
}
