package com.khuoo.portfolio.monitoring.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.logging.TraceContext;
import com.khuoo.portfolio.common.util.PortfolioEnums.ErrorService;
import com.khuoo.portfolio.common.validation.TraceIdValidator;
import com.khuoo.portfolio.monitoring.domain.ErrorLog;
import com.khuoo.portfolio.monitoring.dto.ErrorLogRequest;
import com.khuoo.portfolio.monitoring.repository.ErrorLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Locale;
import java.util.Map;

// Portfolio Frontend·Backend HTTP 5xx 요약 저장 처리
@Service
@RequiredArgsConstructor
public class ErrorLogService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final String INTERNAL_ERROR_PATH = "/internal/v1/error-logs";
    private static final String FRONTEND_MESSAGE = "Frontend 요청 처리 중 오류 발생";

    private final ErrorLogRepository errorLogRepository;
    private final TraceIdValidator traceIdValidator;
    private final LogEventLogger logEventLogger;
    private final Clock clock;

    // 검증된 Frontend 5xx 요약 Best-effort 저장
    public void recordFrontend(ErrorLogRequest request) {
        if (request.service() != ErrorService.FRONTEND
                || !traceIdValidator.isValid(request.traceId())) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        saveBestEffort(ErrorLog.create(
                now(),
                ErrorService.FRONTEND,
                request.method().toUpperCase(Locale.ROOT),
                safePath(request.path()),
                request.statusCode(),
                request.errorCode(),
                FRONTEND_MESSAGE,
                request.traceId()
        ));
    }

    // Backend 5xx 안전 응답 정보 Best-effort 저장
    public void recordBackend(HttpServletRequest request, ErrorCode errorCode) {
        if (INTERNAL_ERROR_PATH.equals(request.getRequestURI())) {
            return;
        }
        saveBestEffort(ErrorLog.create(
                now(),
                ErrorService.BACKEND,
                request.getMethod(),
                request.getRequestURI(),
                errorCode.status().value(),
                errorCode.code(),
                errorCode.message(),
                TraceContext.get(request)
        ));
    }

    private void saveBestEffort(ErrorLog errorLog) {
        try {
            errorLogRepository.save(errorLog);
        } catch (RuntimeException exception) {
            logEventLogger.error(
                    "monitoring.error-log.failure",
                    "HTTP 5xx 요약 저장 실패",
                    Map.of("sourceService", errorLog.getService()),
                    exception
            );
        }
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(clock).atZoneSameInstant(KST).toOffsetDateTime();
    }

    private String safePath(String path) {
        int queryIndex = path.indexOf('?');
        int fragmentIndex = path.indexOf('#');
        int end = path.length();
        if (queryIndex >= 0) {
            end = queryIndex;
        }
        if (fragmentIndex >= 0) {
            end = Math.min(end, fragmentIndex);
        }
        String safePath = path.substring(0, end);
        return safePath.isBlank() ? "/" : safePath;
    }
}
