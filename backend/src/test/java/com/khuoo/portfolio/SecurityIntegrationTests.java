package com.khuoo.portfolio;

import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// API 접근 정책과 CSRF·Trace ID 통합 검증
@ActiveProfiles("local")
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApiConfig.class)
class SecurityIntegrationTests extends PostgresIntegrationTest {

    private static final String REQUEST_ID = "request_2026-08-27-valid";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserDetailsService userDetailsService;

    // Public·Tools·Admin Role 접근 정책 검증
    @Test
    void apiAccessPolicyMatchesRoles() throws Exception {
        mockMvc.perform(get("/api/v1/public/test"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/tools/test"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"))
                .andExpect(jsonPath("$.fieldErrors").isArray());
        mockMvc.perform(get("/api/v1/tools/test").with(user("user").roles("USER")))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/tools/test").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/admin/test"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
        mockMvc.perform(get("/api/v1/admin/test").with(user("user").roles("USER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));
        mockMvc.perform(get("/api/v1/admin/test").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk());
    }

    // BCrypt Cost와 임의 기본 사용자 미생성 검증
    @Test
    void authenticationFoundationHasNoDefaultUser() {
        assertThat(passwordEncoder.encode("test-only-password")).startsWith("$2a$12$");
        assertThatThrownBy(() -> userDetailsService.loadUserByUsername("user"))
                .isInstanceOf(UsernameNotFoundException.class);
    }

    // LOCAL Browser Session Cookie 속성 검증
    @Test
    void localSessionCookieUsesBrowserPolicy() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/public/test/session"))
                .andExpect(status().isOk())
                .andExpect(cookie().exists("PORTFOLIO_SESSION"))
                .andReturn();
        Cookie sessionCookie = result.getResponse().getCookie("PORTFOLIO_SESSION");

        assertThat(sessionCookie).isNotNull();
        assertThat(sessionCookie.isHttpOnly()).isTrue();
        assertThat(sessionCookie.getSecure()).isFalse();
        assertThat(sessionCookie.getPath()).isEqualTo("/");
        assertThat(sessionCookie.getMaxAge()).isEqualTo(-1);
        assertThat(result.getResponse().getHeader("Set-Cookie")).contains("SameSite=Lax");
    }

    // CSRF Cookie 발급과 Browser·Internal 상태 변경 정책 검증
    @Test
    void csrfPolicyMatchesBrowserAndInternalRequests() throws Exception {
        MvcResult csrfResult = mockMvc.perform(get("/api/v1/auth/csrf"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(cookie().exists("XSRF-TOKEN"))
                .andReturn();
        Cookie csrfCookie = csrfResult.getResponse().getCookie("XSRF-TOKEN");

        assertThat(csrfCookie).isNotNull();
        assertThat(csrfCookie.isHttpOnly()).isFalse();

        mockMvc.perform(post("/api/v1/tools/test").with(user("user").roles("USER")))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));

        mockMvc.perform(post("/api/v1/tools/test")
                        .with(user("user").roles("USER"))
                        .cookie(csrfCookie)
                        .header("X-XSRF-TOKEN", csrfCookie.getValue()))
                .andExpect(status().isNoContent());

        mockMvc.perform(post("/internal/v1/test"))
                .andExpect(status().isNoContent());
    }

    // 외부 Request ID 검증과 신규 Trace ID 생성 검증
    @Test
    void traceIdIsValidatedAndReturned() throws Exception {
        MvcResult generated = mockMvc.perform(get("/api/v1/public/test"))
                .andExpect(status().isOk())
                .andExpect(header().exists("X-Request-Id"))
                .andReturn();
        String generatedTraceId = generated.getResponse().getHeader("X-Request-Id");

        assertThat(generatedTraceId)
                .isNotBlank()
                .hasSizeLessThanOrEqualTo(64)
                .matches("[A-Za-z0-9_-]+");

        mockMvc.perform(get("/api/v1/public/test").header("X-Request-Id", REQUEST_ID))
                .andExpect(status().isOk())
                .andExpect(header().string("X-Request-Id", REQUEST_ID));

        MvcResult invalid = mockMvc.perform(get("/api/v1/public/test")
                        .header("X-Request-Id", "invalid request id"))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(invalid.getResponse().getHeader("X-Request-Id"))
                .isNotEqualTo("invalid request id");

        String tooLong = "a".repeat(65);
        MvcResult oversized = mockMvc.perform(get("/api/v1/public/test")
                        .header("X-Request-Id", tooLong))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(oversized.getResponse().getHeader("X-Request-Id")).isNotEqualTo(tooLong);
        assertThat(MDC.get("traceId")).isNull();
    }

    // Security 오류 Body와 Header의 동일 Trace ID 검증
    @Test
    void securityErrorUsesCurrentTraceId() throws Exception {
        MvcResult result = mockMvc.perform(get("/api/v1/admin/test"))
                .andExpect(status().isUnauthorized())
                .andExpect(header().exists("X-Request-Id"))
                .andReturn();
        String traceId = result.getResponse().getHeader("X-Request-Id");

        mockMvc.perform(get("/api/v1/admin/test").header("X-Request-Id", traceId))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.traceId").value(traceId))
                .andExpect(jsonPath("$.fieldErrors").isEmpty());
    }
}
