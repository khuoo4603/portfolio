package com.khuoo.portfolio;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Monitoring 설정과 Target 관리 API 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
class MonitoringAdminIntegrationTests extends PostgresIntegrationTest {

    private static final String MONITORING_PATH = "/api/v1/admin/monitoring";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM monitoring_targets WHERE service_key LIKE 'TEST_%'");
        jdbcTemplate.update("""
                UPDATE monitoring_settings
                SET enabled = TRUE,
                    check_interval_seconds = 300,
                    connect_timeout_ms = 2000,
                    request_timeout_ms = 3000,
                    retry_delay_ms = 500,
                    max_retries = 1
                WHERE id = 1
                """);
    }

    // V3 Seed 기반 Monitoring 관리 조회와 ADMIN 권한 경계 검증
    @Test
    void monitoringSnapshotReturnsSeedSettingsAndTargetsForAdminOnly() throws Exception {
        mockMvc.perform(get(MONITORING_PATH))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get(MONITORING_PATH).with(user("user").roles("USER")))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(MONITORING_PATH).with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.settings.enabled").value(true))
                .andExpect(jsonPath("$.settings.checkIntervalSeconds").value(300))
                .andExpect(jsonPath("$.settings.connectTimeoutMs").value(2000))
                .andExpect(jsonPath("$.settings.requestTimeoutMs").value(3000))
                .andExpect(jsonPath("$.settings.retryDelayMs").value(500))
                .andExpect(jsonPath("$.settings.maxRetries").value(1))
                .andExpect(jsonPath("$.targets.length()").value(6))
                .andExpect(jsonPath("$.targets[0].serviceKey").value("PORTFOLIO_FRONTEND"))
                .andExpect(jsonPath("$.targets[0].healthUrl").value("http://frontend:3000/healthz"))
                .andExpect(jsonPath("$.targets[1].serviceKey").value("PORTFOLIO_BACKEND"))
                .andExpect(jsonPath("$.targets[1].healthUrl").value("http://backend:8080/actuator/health"))
                .andExpect(jsonPath("$.targets[2].healthUrl").doesNotExist())
                .andExpect(jsonPath("$.targets[2].enabled").value(false));
    }

    // CSRF 기반 Runtime 설정 수정과 수치 검증 경계 확인
    @Test
    void settingsUpdateRequiresAdminAndCsrfAndRejectsInvalidNumbers() throws Exception {
        String body = "{\"checkIntervalSeconds\":60,\"retryDelayMs\":0}";

        mockMvc.perform(patch(MONITORING_PATH + "/settings").with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(patch(MONITORING_PATH + "/settings").with(user("user").roles("USER")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch(MONITORING_PATH + "/settings").with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch(MONITORING_PATH + "/settings").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.checkIntervalSeconds").value(60))
                .andExpect(jsonPath("$.retryDelayMs").value(0));
        assertThat(jdbcTemplate.queryForMap("""
                SELECT check_interval_seconds, retry_delay_ms
                FROM monitoring_settings
                WHERE id = 1
                """)).containsEntry("check_interval_seconds", 60)
                .containsEntry("retry_delay_ms", 0);

        mockMvc.perform(patch(MONITORING_PATH + "/settings").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"checkIntervalSeconds\":0}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch(MONITORING_PATH + "/settings").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"connectTimeoutMs\":-1}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch(MONITORING_PATH + "/settings").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"requestTimeoutMs\":0}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch(MONITORING_PATH + "/settings").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"retryDelayMs\":-1}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch(MONITORING_PATH + "/settings").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"maxRetries\":-1}"))
                .andExpect(status().isBadRequest());
    }

    // 자유 Service Key 생성과 HTTP URL 대상 규칙 검증
    @Test
    void targetCreateAllowsValidUrlsAndRejectsDuplicateOrInvalidState() throws Exception {
        String validBody = """
                {
                  "serviceKey":"TEST_INTERNAL_SERVICE",
                  "displayName":"Internal Service",
                  "healthUrl":"http://192.168.219.110:8080/status",
                  "enabled":true,
                  "displayOrder":7
                }
                """;

        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(validBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.serviceKey").value("TEST_INTERNAL_SERVICE"))
                .andExpect(jsonPath("$.healthUrl").value("http://192.168.219.110:8080/status"));
        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceKey\":\"TEST_DOCKER_SERVICE\",\"displayName\":\"Docker Service\",\"healthUrl\":\"http://monitor-service:8080/ready\",\"enabled\":true,\"displayOrder\":8}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.healthUrl").value("http://monitor-service:8080/ready"));
        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceKey\":\"TEST_HTTPS_SERVICE\",\"displayName\":\"HTTPS Service\",\"healthUrl\":\"https://example.com/api/status\",\"enabled\":true,\"displayOrder\":9}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.healthUrl").value("https://example.com/api/status"));
        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(validBody))
                .andExpect(status().isConflict());
        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON).content(validBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceKey\":\"TEST_NULL_URL\",\"displayName\":\"No URL\",\"healthUrl\":null,\"enabled\":true,\"displayOrder\":8}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceKey\":\"TEST_FTP\",\"displayName\":\"FTP\",\"healthUrl\":\"ftp://example.com/status\",\"enabled\":true,\"displayOrder\":8}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceKey\":\"invalid key\",\"displayName\":\"Invalid Key\",\"healthUrl\":\"http://example.com/status\",\"enabled\":true,\"displayOrder\":8}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceKey\":\"TEST_BLANK_NAME\",\"displayName\":\" \",\"healthUrl\":\"http://example.com/status\",\"enabled\":true,\"displayOrder\":8}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceKey\":\"TEST_NEGATIVE_ORDER\",\"displayName\":\"Negative Order\",\"healthUrl\":\"http://example.com/status\",\"enabled\":true,\"displayOrder\":-1}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(post(MONITORING_PATH + "/targets").with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"serviceKey\":\"TEST_DISABLED\",\"displayName\":\"Disabled\",\"healthUrl\":null,\"enabled\":false,\"displayOrder\":8}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.healthUrl").doesNotExist())
                .andExpect(jsonPath("$.enabled").value(false));
    }

    // Target 수정 가능 필드와 Service Key 불변 조건 검증
    @Test
    void targetUpdatePreservesServiceKeyAndAllowsDisabledNullUrl() throws Exception {
        Long targetId = jdbcTemplate.queryForObject("""
                SELECT id
                FROM monitoring_targets
                WHERE service_key = 'PORTFOLIO_FRONTEND'
                """, Long.class);
        String updateBody = """
                {
                  "displayName":"Portfolio Web",
                  "healthUrl":null,
                  "enabled":false,
                  "displayOrder":0
                }
                """;

        mockMvc.perform(patch(MONITORING_PATH + "/targets/" + targetId)
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(updateBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.serviceKey").value("PORTFOLIO_FRONTEND"))
                .andExpect(jsonPath("$.displayName").value("Portfolio Web"))
                .andExpect(jsonPath("$.healthUrl").doesNotExist())
                .andExpect(jsonPath("$.enabled").value(false))
                .andExpect(jsonPath("$.displayOrder").value(0));
        mockMvc.perform(patch(MONITORING_PATH + "/targets/" + targetId)
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"serviceKey\":\"TEST_CHANGED\"}"))
                .andExpect(status().isBadRequest());
        mockMvc.perform(patch(MONITORING_PATH + "/targets/999999")
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"displayName\":\"Missing\"}"))
                .andExpect(status().isNotFound());
        mockMvc.perform(patch(MONITORING_PATH + "/targets/" + targetId)
                        .with(user("admin").roles("ADMIN")).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":true,\"healthUrl\":null}"))
                .andExpect(status().isBadRequest());
    }
}
