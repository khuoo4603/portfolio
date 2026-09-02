package com.khuoo.portfolio;

import com.khuoo.portfolio.analytics.dto.PageViewRequest;
import com.khuoo.portfolio.analytics.service.AnalyticsService;
import com.khuoo.portfolio.monitoring.scheduler.MonitoringScheduler;
import com.khuoo.portfolio.monitoring.service.LogCleanupService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.core.env.Environment;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.context.WebApplicationContext;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.stream.IntStream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Analytics·Dashboard·운영 로그·보관기간 PostgreSQL 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestApiConfig.class, OperationsIntegrationTests.FixedClockConfig.class})
class OperationsIntegrationTests extends PostgresIntegrationTest {

    private static final String PAGE_VIEW_PATH = "/internal/v1/analytics/page-view";
    private static final String DASHBOARD_PATH = "/api/v1/admin/dashboard";
    private static final String LOGIN_LOG_PATH = "/api/v1/admin/logs/logins";
    private static final String ERROR_LOG_PATH = "/api/v1/admin/logs/errors";
    private static final OffsetDateTime NOW = OffsetDateTime.parse("2026-08-29T00:30:00+09:00");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private AnalyticsService analyticsService;

    @Autowired
    private LogCleanupService logCleanupService;

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private Environment environment;

    @BeforeEach
    void setUp() {
        clearData();
    }

    @AfterEach
    void tearDown() {
        clearData();
    }

    // 허용 경로와 동일 방문자 Upsert 및 KST 날짜 기준 검증
    @Test
    void pageViewsTrackOnlyAllowedPaths() throws Exception {
        UUID firstVisitor = UUID.randomUUID();
        UUID secondVisitor = UUID.randomUUID();
        jdbcTemplate.update("UPDATE projects SET enabled = FALSE WHERE slug = 'shkutrack'");

        recordPageView(firstVisitor, "/");
        recordPageView(firstVisitor, "/");
        recordPageView(secondVisitor, "/projects/kyvc");
        recordPageView(UUID.randomUUID(), "/projects/shkutrack");
        recordPageView(UUID.randomUUID(), "/projects/not-found");
        recordPageView(UUID.randomUUID(), "/admin");
        recordPageView(UUID.randomUUID(), "/projects/kyvc/detail");

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM daily_visits", Integer.class)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForObject("""
                SELECT page_view_count
                FROM daily_visits
                WHERE visitor_key = ?
                """, Integer.class, firstVisitor)).isEqualTo(2);
        assertThat(jdbcTemplate.queryForList(
                "SELECT DISTINCT visit_date::text FROM daily_visits", String.class))
                .containsExactly("2026-08-29");
    }

    // 동시 요청의 PostgreSQL 원자적 증가와 단일 Row 유지 검증
    @Test
    void concurrentPageViewsUseAtomicUpsert() throws Exception {
        UUID visitorKey = UUID.randomUUID();
        ExecutorService executor = Executors.newFixedThreadPool(8);
        try {
            Future<?>[] tasks = IntStream.range(0, 24)
                    .mapToObj(index -> executor.submit(() ->
                            analyticsService.record(new PageViewRequest(visitorKey, "/"))))
                    .toArray(Future<?>[]::new);
            for (Future<?> task : tasks) {
                task.get();
            }
        } finally {
            executor.shutdownNow();
        }

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM daily_visits WHERE visitor_key = ?", Integer.class, visitorKey))
                .isOne();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT page_view_count FROM daily_visits WHERE visitor_key = ?", Integer.class, visitorKey))
                .isEqualTo(24);
    }

    // Dashboard 권한·기간·Zero-fill·실제 Service Row·사이트 집계 계약 검증
    @Test
    void dashboardUsesActualRowsAndZeroFillsTraffic() throws Exception {
        UUID todayVisitor = UUID.randomUUID();
        insertVisit("2026-08-29", todayVisitor, 3);
        insertVisit("2026-06-05", UUID.randomUUID(), 2);
        insertVisit("2026-06-06", UUID.randomUUID(), 4);
        jdbcTemplate.update("""
                INSERT INTO accounts (email, name, password_hash, role, enabled)
                VALUES ('active@example.com', '활성 계정', 'hash', 'USER', TRUE),
                       ('disabled@example.com', '비활성 계정', 'hash', 'USER', FALSE)
                """);
        insertServiceStatus("SHKUTRACK", "DOWN", null, null);
        insertServiceStatus("PORTFOLIO_FRONTEND", "UP", 18, 204);

        mockMvc.perform(get(DASHBOARD_PATH)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(DASHBOARD_PATH).with(user("user").roles("USER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get(DASHBOARD_PATH).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.traffic.todayVisitors").value(1))
                .andExpect(jsonPath("$.traffic.todayPageViews").value(3))
                .andExpect(jsonPath("$.traffic.monthVisitors").value(1))
                .andExpect(jsonPath("$.traffic.monthPageViews").value(3))
                .andExpect(jsonPath("$.traffic.trend.length()").value(6))
                .andExpect(jsonPath("$.traffic.trend[0].month").value("2026-03"))
                .andExpect(jsonPath("$.traffic.trend[1].visitors").value(0))
                .andExpect(jsonPath("$.traffic.trend[3].month").value("2026-06"))
                .andExpect(jsonPath("$.traffic.trend[3].visitors").value(2))
                .andExpect(jsonPath("$.traffic.trend[3].pageViews").value(6))
                .andExpect(jsonPath("$.serviceStatus.length()").value(2))
                .andExpect(jsonPath("$.serviceStatus[0].serviceKey").value("PORTFOLIO_FRONTEND"))
                .andExpect(jsonPath("$.serviceStatus[0].status").value("UP"))
                .andExpect(jsonPath("$.serviceStatus[0].lastCheckedAt").value(
                        org.hamcrest.Matchers.endsWith("+09:00")))
                .andExpect(jsonPath("$.serviceStatus[1].serviceKey").value("SHKUTRACK"))
                .andExpect(jsonPath("$.siteSummary.publicProjects").value(1))
                .andExpect(jsonPath("$.siteSummary.portfolioTechnologies").value(12))
                .andExpect(jsonPath("$.siteSummary.activeTools").value(2))
                .andExpect(jsonPath("$.siteSummary.activeAccounts").value(1))
                .andExpect(jsonPath("$.recentErrors").doesNotExist())
                .andExpect(jsonPath("$.recentLogins").doesNotExist());

        mockMvc.perform(get(DASHBOARD_PATH).with(user("admin").roles("ADMIN")).param("months", "12"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.traffic.trend.length()").value(12));
        mockMvc.perform(get(DASHBOARD_PATH).with(user("admin").roles("ADMIN")).param("months", "5"))
                .andExpect(status().isBadRequest());

        assertThat(applicationContext).isInstanceOf(WebApplicationContext.class);
        assertThat(applicationContext.getBeansOfType(MonitoringScheduler.class)).isEmpty();
        assertThat(environment.getProperty("portfolio.monitoring.enabled", Boolean.class)).isFalse();
    }

    // Login Logs 권한과 기간·Email·결과·복합 조건·Pagination 계약 검증
    @Test
    void loginLogsSupportFiltersPaginationAndKstTimestamp() throws Exception {
        insertLogin("2026-08-28T10:00:00+09:00", "alice@example.com", true, null, "trace-login-success");
        insertLogin("2026-08-28T11:00:00+09:00", "alice@example.com", false,
                "INVALID_CREDENTIALS", "trace-login-failure");
        insertLogin("2026-08-20T09:00:00+09:00", "bob@example.com", true, null, "trace-login-old");

        mockMvc.perform(get(LOGIN_LOG_PATH)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(LOGIN_LOG_PATH).with(user("user").roles("USER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get(LOGIN_LOG_PATH)
                        .with(user("admin").roles("ADMIN"))
                        .param("from", "2026-08-28T00:00:00+09:00")
                        .param("to", "2026-08-28T23:59:59+09:00")
                        .param("email", " ALICE@EXAMPLE.COM ")
                        .param("result", "FAILURE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].email").value("alice@example.com"))
                .andExpect(jsonPath("$.items[0].result").value("FAILURE"))
                .andExpect(jsonPath("$.items[0].failureReason").value("INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.items[0].traceId").value("trace-login-failure"))
                .andExpect(jsonPath("$.items[0].occurredAt").value(
                        org.hamcrest.Matchers.endsWith("+09:00")));

        mockMvc.perform(get(LOGIN_LOG_PATH)
                        .with(user("admin").roles("ADMIN"))
                        .param("result", "SUCCESS")
                        .param("page", "1")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page").value(1))
                .andExpect(jsonPath("$.size").value(1))
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items.length()").value(1));
    }

    // Error Logs 권한과 기간·서비스·Status·Pagination 계약 검증
    @Test
    void errorLogsSupportFiltersAndPagination() throws Exception {
        insertError("2026-08-28T10:00:00+09:00", "FRONTEND", 500, "trace-front-500");
        insertError("2026-08-28T11:00:00+09:00", "BACKEND", 503, "trace-back-503");
        insertError("2026-08-20T09:00:00+09:00", "FRONTEND", 502, "trace-front-old");

        mockMvc.perform(get(ERROR_LOG_PATH)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(ERROR_LOG_PATH).with(user("user").roles("USER")))
                .andExpect(status().isForbidden());

        mockMvc.perform(get(ERROR_LOG_PATH)
                        .with(user("admin").roles("ADMIN"))
                        .param("from", "2026-08-28T00:00:00+09:00")
                        .param("to", "2026-08-28T23:59:59+09:00")
                        .param("service", "BACKEND")
                        .param("statusCode", "503"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].service").value("BACKEND"))
                .andExpect(jsonPath("$.items[0].statusCode").value(503))
                .andExpect(jsonPath("$.items[0].traceId").value("trace-back-503"));

        mockMvc.perform(get(ERROR_LOG_PATH)
                        .with(user("admin").roles("ADMIN"))
                        .param("service", "FRONTEND")
                        .param("page", "1")
                        .param("size", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalElements").value(2))
                .andExpect(jsonPath("$.items.length()").value(1));
        mockMvc.perform(get(ERROR_LOG_PATH)
                        .with(user("admin").roles("ADMIN"))
                        .param("statusCode", "499"))
                .andExpect(status().isBadRequest());
    }

    // Frontend 내부 5xx 기록의 Validation·민감정보 제거·Trace ID 저장 검증
    @Test
    void internalFrontendErrorLogUsesSafeSummary() throws Exception {
        String body = """
                {
                  "service":"FRONTEND",
                  "method":"post",
                  "path":"/admin?password=secret#section",
                  "statusCode":500,
                  "errorCode":"FRONTEND_RENDER_ERROR",
                  "message":"password=secret 전체 내부 오류",
                  "traceId":"trace_frontend_500"
                }
                """;
        mockMvc.perform(post("/internal/v1/error-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isNoContent());

        assertThat(jdbcTemplate.queryForMap("""
                SELECT service, method, path, status_code, message, trace_id
                FROM error_logs
                WHERE trace_id = 'trace_frontend_500'
                """))
                .containsEntry("service", "FRONTEND")
                .containsEntry("method", "POST")
                .containsEntry("path", "/admin")
                .containsEntry("status_code", 500)
                .containsEntry("message", "Frontend 요청 처리 중 오류 발생")
                .containsEntry("trace_id", "trace_frontend_500");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT message FROM error_logs WHERE trace_id = 'trace_frontend_500'", String.class))
                .doesNotContain("secret", "password");

        mockMvc.perform(post("/internal/v1/error-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("FRONTEND", "BACKEND")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/internal/v1/error-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("500", "499")))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post("/internal/v1/error-logs")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body.replace("trace_frontend_500", "invalid trace id")))
                .andExpect(status().isBadRequest());
    }

    // Backend 500 응답과 Database 요약의 동일 Trace ID 검증
    @Test
    void backendErrorResponseAndStoredLogShareTraceId() throws Exception {
        String traceId = "trace_backend_500";
        mockMvc.perform(get("/api/v1/public/test/failure").header("X-Request-Id", traceId))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.traceId").value(traceId));

        assertThat(jdbcTemplate.queryForMap("""
                SELECT service, method, path, status_code, error_code, trace_id
                FROM error_logs
                WHERE trace_id = ?
                """, traceId))
                .containsEntry("service", "BACKEND")
                .containsEntry("method", "GET")
                .containsEntry("path", "/api/v1/public/test/failure")
                .containsEntry("status_code", 500)
                .containsEntry("error_code", "COMMON_INTERNAL_ERROR")
                .containsEntry("trace_id", traceId);
    }

    // Login 3년·Error 365일 정확한 경계와 독립 정리 검증
    @Test
    void cleanupDeletesOnlyRowsOlderThanRetentionBoundary() {
        OffsetDateTime loginCutoff = NOW.minusYears(3);
        OffsetDateTime errorCutoff = NOW.minusDays(365);
        insertLogin(loginCutoff.minusSeconds(1).toString(), "old@example.com", true, null, "login-old");
        insertLogin(loginCutoff.toString(), "boundary@example.com", true, null, "login-boundary");
        insertLogin(loginCutoff.plusSeconds(1).toString(), "new@example.com", true, null, "login-new");
        insertError(errorCutoff.minusSeconds(1).toString(), "BACKEND", 500, "error-old");
        insertError(errorCutoff.toString(), "BACKEND", 500, "error-boundary");
        insertError(errorCutoff.plusSeconds(1).toString(), "FRONTEND", 500, "error-new");
        insertVisit("2026-08-29", UUID.randomUUID(), 1);

        LogCleanupService.CleanupResult result = logCleanupService.cleanup();

        assertThat(result.loginLogs()).isOne();
        assertThat(result.errorLogs()).isOne();
        assertThat(jdbcTemplate.queryForList(
                "SELECT trace_id FROM login_logs ORDER BY trace_id", String.class))
                .containsExactly("login-boundary", "login-new");
        assertThat(jdbcTemplate.queryForList(
                "SELECT trace_id FROM error_logs ORDER BY trace_id", String.class))
                .containsExactly("error-boundary", "error-new");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM daily_visits", Integer.class)).isOne();
    }

    private void recordPageView(UUID visitorKey, String path) throws Exception {
        mockMvc.perform(post(PAGE_VIEW_PATH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"visitorKey\":\"%s\",\"path\":\"%s\"}".formatted(visitorKey, path)))
                .andExpect(status().isNoContent());
    }

    private void insertVisit(String date, UUID visitorKey, int count) {
        jdbcTemplate.update("""
                INSERT INTO daily_visits (
                    visit_date, visitor_key, page_view_count, first_viewed_at, last_viewed_at
                ) VALUES (?::date, ?, ?, ?::timestamptz, ?::timestamptz)
                """, date, visitorKey, count, NOW.toString(), NOW.toString());
    }

    private void insertServiceStatus(String key, String status, Integer responseTime, Integer httpStatus) {
        jdbcTemplate.update("""
                INSERT INTO service_status (
                    service_key, status, response_time_ms, http_status, last_checked_at
                ) VALUES (?, ?, ?, ?, ?::timestamptz)
                """, key, status, responseTime, httpStatus, NOW.toString());
    }

    private void insertLogin(
            String occurredAt,
            String email,
            boolean success,
            String failureReason,
            String traceId
    ) {
        jdbcTemplate.update("""
                INSERT INTO login_logs (
                    occurred_at, email, event_type, success, failure_reason,
                    ip_address, user_agent, browser, operating_system, device, trace_id
                ) VALUES (
                    ?::timestamptz, ?, ?, ?, ?, '127.0.0.1',
                    'Mozilla/5.0', 'Chrome', 'Windows', 'DESKTOP', ?
                )
                """, occurredAt, email, success ? "LOGIN_SUCCESS" : "LOGIN_FAILURE",
                success, failureReason, traceId);
    }

    private void insertError(String occurredAt, String service, int status, String traceId) {
        jdbcTemplate.update("""
                INSERT INTO error_logs (
                    occurred_at, service, method, path, status_code, error_code, message, trace_id
                ) VALUES (?::timestamptz, ?, 'GET', '/test', ?::smallint, 'TEST_ERROR', '안전한 요약', ?)
                """, occurredAt, service, status, traceId);
    }

    private void clearData() {
        jdbcTemplate.update("DELETE FROM error_logs");
        jdbcTemplate.update("DELETE FROM login_logs");
        jdbcTemplate.update("DELETE FROM service_status");
        jdbcTemplate.update("DELETE FROM daily_visits");
        jdbcTemplate.update("DELETE FROM verification_challenges");
        jdbcTemplate.update("DELETE FROM accounts");
        jdbcTemplate.update("""
                UPDATE projects
                SET enabled = CASE WHEN slug = 'kyvc' THEN TRUE ELSE FALSE END
                WHERE slug IN ('kyvc', 'shkutrack', 'shkuload')
                """);
    }

    // KST 날짜 경계와 보관기간 경계 재현용 고정 Clock
    @TestConfiguration(proxyBeanMethods = false)
    static class FixedClockConfig {

        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(Instant.parse("2026-08-28T15:30:00Z"), ZoneOffset.UTC);
        }
    }
}
