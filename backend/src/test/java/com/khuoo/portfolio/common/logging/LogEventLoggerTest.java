package com.khuoo.portfolio.common.logging;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.mock.env.MockEnvironment;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

// 업무 이벤트 로그 형식과 민감정보 비노출 검증
class LogEventLoggerTest {

    private Logger logger;
    private ListAppender<ILoggingEvent> appender;
    private LogEventLogger eventLogger;

    @BeforeEach
    void attachAppender() {
        MockEnvironment environment = new MockEnvironment();
        environment.setActiveProfiles("local");
        eventLogger = new LogEventLogger(environment);

        logger = (Logger) LoggerFactory.getLogger(LogEventLogger.class);
        appender = new ListAppender<>();
        appender.start();
        logger.addAppender(appender);
        MDC.put(TraceContext.MDC_KEY, "trace-test");
    }

    @AfterEach
    void detachAppender() {
        MDC.remove(TraceContext.MDC_KEY);
        logger.detachAppender(appender);
        appender.stop();
    }

    // 공통 필드와 이메일·비밀번호 마스킹 검증
    @Test
    void logsMaskedBusinessEventFields() {
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("email", "user@example.com");
        fields.put("password", "plain-secret");

        eventLogger.info(
                "auth.login.failure",
                "로그인 실패 user@example.com",
                fields
        );

        assertThat(appender.list).hasSize(1);
        ILoggingEvent event = appender.list.getFirst();
        assertThat(event.getLevel()).isEqualTo(Level.INFO);
        assertThat(event.getFormattedMessage())
                .contains(
                        "service=backend",
                        "env=local",
                        "traceId=trace-test",
                        "event=auth.login.failure",
                        "email=u****@example.com",
                        "password=[MASKED]",
                        "message=\"로그인 실패 u****@example.com\""
                )
                .doesNotContain("user@example.com", "plain-secret");
    }

    // ERROR 업무 이벤트의 Throwable 전달 검증
    @Test
    void logsThrowableForErrorEvent() {
        RuntimeException exception = new RuntimeException("test failure");

        eventLogger.error(
                "monitor.health.failure",
                "서비스 상태 확인 실패",
                Map.of("serviceKey", "PORTFOLIO_BACKEND"),
                exception
        );

        assertThat(appender.list).hasSize(1);
        ILoggingEvent event = appender.list.getFirst();
        assertThat(event.getLevel()).isEqualTo(Level.ERROR);
        assertThat(event.getThrowableProxy()).isNotNull();
        assertThat(event.getFormattedMessage())
                .contains("event=monitor.health.failure", "serviceKey=PORTFOLIO_BACKEND");
    }
}
