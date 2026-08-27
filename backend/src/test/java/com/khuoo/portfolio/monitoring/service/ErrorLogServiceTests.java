package com.khuoo.portfolio.monitoring.service;

import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.util.PortfolioEnums.ErrorService;
import com.khuoo.portfolio.common.validation.TraceIdValidator;
import com.khuoo.portfolio.monitoring.dto.ErrorLogRequest;
import com.khuoo.portfolio.monitoring.repository.ErrorLogRepository;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// Error Log Best-effort와 재귀 방지 단위 검증
class ErrorLogServiceTests {

    private static final Clock CLOCK = Clock.fixed(Instant.parse("2026-08-28T15:30:00Z"), ZoneOffset.UTC);

    // 저장 실패가 원래 5xx 처리 흐름을 덮지 않는지 검증
    @Test
    void storageFailureIsBestEffort() {
        ErrorLogRepository repository = mock(ErrorLogRepository.class);
        when(repository.save(any())).thenThrow(new IllegalStateException("database unavailable"));
        ErrorLogService service = new ErrorLogService(
                repository,
                new TraceIdValidator(),
                mock(LogEventLogger.class),
                CLOCK
        );

        assertThatCode(() -> service.recordFrontend(new ErrorLogRequest(
                ErrorService.FRONTEND,
                "GET",
                "/page",
                500,
                "FRONTEND_ERROR",
                "민감할 수 있는 원문",
                "trace_best_effort"
        ))).doesNotThrowAnyException();
    }

    // 내부 기록 Endpoint 오류의 동일 Endpoint 재기록 차단 검증
    @Test
    void internalErrorEndpointDoesNotRecurse() {
        ErrorLogRepository repository = mock(ErrorLogRepository.class);
        ErrorLogService service = new ErrorLogService(
                repository,
                new TraceIdValidator(),
                mock(LogEventLogger.class),
                CLOCK
        );
        MockHttpServletRequest request = new MockHttpServletRequest("POST", "/internal/v1/error-logs");

        service.recordBackend(request, com.khuoo.portfolio.common.error.ErrorCode.COMMON_INTERNAL_ERROR);

        verify(repository, never()).save(any());
    }
}
