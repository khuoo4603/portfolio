package com.khuoo.portfolio;

import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 공통 오류 응답과 HTTP 로그 분류 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApiConfig.class)
class ErrorAndLoggingIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    private Logger httpLogger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void attachLogAppender() {
        httpLogger = (Logger) LoggerFactory.getLogger("HTTP_REQUEST");
        appender = new ListAppender<>();
        appender.start();
        httpLogger.addAppender(appender);
    }

    @AfterEach
    void detachLogAppender() {
        httpLogger.detachAppender(appender);
        appender.stop();
    }

    // Validation과 잘못된 Body 공통 오류 계약 검증
    @Test
    void validationErrorsUseCommonContract() throws Exception {
        mockMvc.perform(post("/internal/v1/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(header().exists("X-Request-Id"))
                .andExpect(jsonPath("$.code").value("COMMON_VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("입력값을 확인하세요."))
                .andExpect(jsonPath("$.traceId").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("name"))
                .andExpect(jsonPath("$.fieldErrors[0].message").value("이름을 입력하세요."));

        mockMvc.perform(post("/internal/v1/test/validation")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{invalid"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors").isEmpty());
    }

    // 예상하지 못한 오류의 내부정보 비노출 검증
    @Test
    void unexpectedErrorUsesSafeResponse() throws Exception {
        mockMvc.perform(get("/api/v1/public/test/failure"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.code").value("COMMON_INTERNAL_ERROR"))
                .andExpect(jsonPath("$.message").value("요청 처리 중 오류가 발생했습니다."))
                .andExpect(jsonPath("$.traceId").isNotEmpty())
                .andExpect(jsonPath("$.fieldErrors").isEmpty())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("외부 노출 금지 내부 오류"))));
    }

    // HTTP 상태별 Log Level과 제외 경로 검증
    @Test
    void httpLogsFollowStatusAndHealthPolicy() throws Exception {
        mockMvc.perform(get("/api/v1/public/test"))
                .andExpect(status().isOk());
        assertSingleHttpLog(Level.INFO, "status=200");

        appender.list.clear();
        mockMvc.perform(get("/api/v1/admin/test"))
                .andExpect(status().isUnauthorized());
        assertSingleHttpLog(Level.WARN, "status=401");

        appender.list.clear();
        mockMvc.perform(get("/api/v1/public/test/failure"))
                .andExpect(status().isInternalServerError());
        assertSingleHttpLog(Level.ERROR, "status=500");

        appender.list.clear();
        mockMvc.perform(get("/api/v1/public/test/redirect"))
                .andExpect(status().is3xxRedirection());
        assertThat(appender.list).isEmpty();

        appender.list.clear();
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
        assertThat(appender.list).isEmpty();
    }

    // Query·Cookie·CSRF Header의 HTTP 로그 비기록 검증
    @Test
    void httpLogDoesNotContainSensitiveRequestData() throws Exception {
        mockMvc.perform(get("/api/v1/public/test")
                        .queryParam("password", "request-secret")
                        .cookie(new Cookie("PORTFOLIO_SESSION", "session-secret"))
                        .header("X-XSRF-TOKEN", "csrf-secret"))
                .andExpect(status().isOk());

        assertThat(appender.list).hasSize(1);
        String message = appender.list.getFirst().getFormattedMessage();
        assertThat(message)
                .contains("path=/api/v1/public/test")
                .doesNotContain("request-secret", "session-secret", "csrf-secret", "password=");
    }

    private void assertSingleHttpLog(Level level, String content) {
        assertThat(appender.list).hasSize(1);
        assertThat(appender.list.getFirst().getLevel()).isEqualTo(level);
        assertThat(appender.list.getFirst().getFormattedMessage())
                .contains("service=backend", "traceId=", content, "durationMs=");
    }
}
