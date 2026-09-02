package com.khuoo.portfolio;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.account.repository.AccountRepository;
import com.khuoo.portfolio.authentication.service.ClientInfoResolver;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mock.env.MockEnvironment;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.session.Session;
import org.springframework.session.SessionRepository;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;

import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.clearInvocations;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Account Credential과 USER Session 인증 흐름 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApiConfig.class)
class AuthenticationIntegrationTests extends PostgresIntegrationTest {

    private static final String PASSWORD = "test-password-2026";
    private static final String LOGIN_PATH = "/api/v1/auth/login";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockitoSpyBean
    private AccountRepository accountRepository;

    @Autowired
    @SuppressWarnings("rawtypes")
    private SessionRepository sessionRepository;

    @MockitoBean
    private JavaMailSender mailSender;

    @BeforeEach
    @AfterEach
    void clearAuthenticationData() {
        jdbcTemplate.update("DELETE FROM login_logs");
        jdbcTemplate.update("DELETE FROM verification_challenges");
        jdbcTemplate.update("DELETE FROM accounts");
    }

    // 이메일 정규화와 ID 기준 Account 조회 검증
    @Test
    void accountRepositoryUsesNormalizedEmailAndId() {
        Long accountId = insertAccount("user@example.com", "사용자", PASSWORD, "USER", true);

        Account byEmail = accountRepository.findByEmail("  USER@EXAMPLE.COM ").orElseThrow();
        Account byId = accountRepository.findById(accountId).orElseThrow();

        assertThat(byEmail.getId()).isEqualTo(accountId);
        assertThat(byEmail.getEmail()).isEqualTo("user@example.com");
        assertThat(byId.getPasswordHash()).startsWith("$2a$12$");
        assertThat(passwordEncoder.matches(PASSWORD, byId.getPasswordHash())).isTrue();
        assertThat(passwordEncoder.matches("wrong-password", byId.getPasswordHash())).isFalse();
    }

    // LOCAL 직접 연결과 DEV/PROD 신뢰 Proxy의 Client IP 선택 검증
    @Test
    void clientIpTrustsOnlyTheConfiguredProxyBoundary() {
        MockHttpServletRequest localRequest = new MockHttpServletRequest();
        localRequest.setRemoteAddr("127.0.0.1");
        localRequest.addHeader("X-Forwarded-For", "203.0.113.10");
        ClientInfoResolver localResolver = new ClientInfoResolver(new MockEnvironment());

        MockEnvironment prodEnvironment = new MockEnvironment();
        prodEnvironment.setActiveProfiles("prod");
        ClientInfoResolver prodResolver = new ClientInfoResolver(prodEnvironment);
        MockHttpServletRequest trustedProxyRequest = new MockHttpServletRequest();
        trustedProxyRequest.setRemoteAddr("172.18.0.3");
        trustedProxyRequest.addHeader("X-Forwarded-For", "203.0.113.20");
        MockHttpServletRequest untrustedRequest = new MockHttpServletRequest();
        untrustedRequest.setRemoteAddr("198.51.100.30");
        untrustedRequest.addHeader("X-Forwarded-For", "203.0.113.30");

        assertThat(localResolver.resolve(localRequest).ipAddress()).isEqualTo("127.0.0.1");
        assertThat(prodResolver.resolve(trustedProxyRequest).ipAddress()).isEqualTo("203.0.113.20");
        assertThat(prodResolver.resolve(untrustedRequest).ipAddress()).isEqualTo("198.51.100.30");
    }

    // 정상 USER 로그인·Session·응답·로그인 기록·권한 검증
    @Test
    void userLoginCreatesSessionAndReturnsCurrentUser() throws Exception {
        Long accountId = insertAccount("user@example.com", "사용자 이름", PASSWORD, "USER", true);

        MvcResult loginResult = login("USER@EXAMPLE.COM", PASSWORD, false, "198.51.100.10")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.redirect").value("/tools"))
                .andExpect(cookie().exists("PORTFOLIO_SESSION"))
                .andReturn();
        Cookie sessionCookie = loginResult.getResponse().getCookie("PORTFOLIO_SESSION");

        assertThat(sessionCookie).isNotNull();
        assertThat(sessionCookie.getMaxAge()).isEqualTo(-1);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT max_inactive_interval FROM spring_session", Integer.class
        )).isEqualTo(PortfolioConstants.Authentication.SESSION_IDLE_TIMEOUT_SECONDS);
        assertThat(jdbcTemplate.queryForMap("""
                SELECT account_id, email, event_type, success, failure_reason,
                       ip_address, browser, operating_system, device, trace_id
                FROM login_logs
                """))
                .containsEntry("account_id", accountId)
                .containsEntry("email", "user@example.com")
                .containsEntry("event_type", "LOGIN_SUCCESS")
                .containsEntry("success", true)
                .containsEntry("failure_reason", null)
                .containsEntry("ip_address", "198.51.100.10")
                .containsEntry("browser", "Chrome")
                .containsEntry("operating_system", "Windows")
                .containsEntry("device", "DESKTOP");

        clearInvocations(accountRepository);
        mockMvc.perform(get("/api/v1/auth/me").cookie(sessionCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(accountId))
                .andExpect(jsonPath("$.email").value("user@example.com"))
                .andExpect(jsonPath("$.name").value("사용자 이름"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.enabled").doesNotExist());
        verify(accountRepository, never()).findById(accountId);

        mockMvc.perform(get("/api/v1/admin/test").cookie(sessionCookie))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));
        mockMvc.perform(get("/api/v1/auth/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
    }

    // 외부 공통 오류와 내부 로그인 실패 사유 분리 검증
    @Test
    void credentialFailuresUseSafeResponseAndStoreReasons() throws Exception {
        insertAccount("enabled@example.com", "활성 사용자", PASSWORD, "USER", true);
        insertAccount("disabled@example.com", "비활성 사용자", PASSWORD, "USER", false);

        assertInvalidCredentials("missing@example.com", PASSWORD, "198.51.100.11");
        assertInvalidCredentials("enabled@example.com", "wrong-password", "198.51.100.12");
        assertInvalidCredentials("disabled@example.com", PASSWORD, "198.51.100.13");

        List<Map<String, Object>> failures = jdbcTemplate.queryForList("""
                SELECT account_id, failure_reason
                FROM login_logs
                ORDER BY id
                """);
        assertThat(failures).hasSize(3);
        assertThat(failures.get(0))
                .containsEntry("account_id", null)
                .containsEntry("failure_reason", "INVALID_CREDENTIALS");
        assertThat(failures.get(1)).containsEntry("failure_reason", "INVALID_CREDENTIALS");
        assertThat(failures.get(2)).containsEntry("failure_reason", "ACCOUNT_DISABLED");
    }

    // 동일 이메일 최근 10분 5회 실패 차단과 차단 기록 검증
    @Test
    void emailRateLimitUsesPersistedFailures() throws Exception {
        insertFailures(5, "limited@example.com", null, "198.51.100.20");

        login("limited@example.com", PASSWORD, false, "198.51.100.21")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("AUTH_RATE_LIMITED"));

        assertThat(lastFailureReason()).isEqualTo("RATE_LIMITED");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM login_logs", Integer.class)).isEqualTo(6);
    }

    // 동일 IP 최근 10분 20회 실패 차단과 Forwarded Header 비신뢰 검증
    @Test
    void ipRateLimitUsesNormalizedRemoteAddress() throws Exception {
        insertFailures(20, null, "ip-attempt-", "198.51.100.30");

        login("new@example.com", PASSWORD, false, "198.51.100.30")
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("AUTH_RATE_LIMITED"));

        assertThat(lastFailureReason()).isEqualTo("RATE_LIMITED");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT ip_address FROM login_logs ORDER BY id DESC LIMIT 1", String.class
        )).isEqualTo("198.51.100.30");
    }

    // 자동 로그인 Cookie·서버 수명과 최초 인증 기준 절대 만료 검증
    @Test
    @SuppressWarnings("unchecked")
    void rememberMeUsesFourteenDayAbsoluteExpiration() throws Exception {
        insertAccount("remember@example.com", "자동 로그인 사용자", PASSWORD, "USER", true);

        MvcResult loginResult = login("remember@example.com", PASSWORD, true, "198.51.100.40")
                .andExpect(status().isOk())
                .andReturn();
        Cookie sessionCookie = loginResult.getResponse().getCookie("PORTFOLIO_SESSION");
        String sessionId = jdbcTemplate.queryForObject(
                "SELECT session_id FROM spring_session",
                String.class
        );

        assertThat(sessionCookie).isNotNull();
        assertThat(sessionCookie.getMaxAge())
                .isEqualTo(PortfolioConstants.Authentication.REMEMBER_ME_SECONDS);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT max_inactive_interval FROM spring_session", Integer.class
        )).isEqualTo(PortfolioConstants.Authentication.REMEMBER_ME_SECONDS);

        Session session = (Session) sessionRepository.findById(sessionId);
        assertThat(session).isNotNull();
        session.setAttribute(
                PortfolioConstants.Authentication.AUTHENTICATED_AT_SESSION_ATTRIBUTE,
                System.currentTimeMillis()
                        - PortfolioConstants.Authentication.REMEMBER_ME_SECONDS * 1_000L
                        - 1_000L
        );
        sessionRepository.save(session);

        mockMvc.perform(get("/api/v1/auth/me").cookie(sessionCookie))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_UNAUTHORIZED"));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM spring_session WHERE session_id = ?",
                Integer.class,
                sessionId
        )).isZero();
    }

    // CSRF 보호 로그아웃과 Session·Cookie 폐기 검증
    @Test
    void logoutRequiresCsrfAndInvalidatesSession() throws Exception {
        insertAccount("logout@example.com", "로그아웃 사용자", PASSWORD, "USER", true);
        MvcResult loginResult = login("logout@example.com", PASSWORD, false, "198.51.100.50")
                .andExpect(status().isOk())
                .andReturn();
        Cookie sessionCookie = loginResult.getResponse().getCookie("PORTFOLIO_SESSION");

        mockMvc.perform(post("/api/v1/auth/logout").cookie(sessionCookie))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));

        MvcResult logoutResult = mockMvc.perform(post("/api/v1/auth/logout")
                        .cookie(sessionCookie)
                        .with(csrf()))
                .andExpect(status().isNoContent())
                .andReturn();
        Cookie deletedCookie = logoutResult.getResponse().getCookie("PORTFOLIO_SESSION");

        assertThat(deletedCookie).isNotNull();
        assertThat(deletedCookie.getMaxAge()).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM spring_session", Integer.class)).isZero();
        mockMvc.perform(get("/api/v1/auth/me").cookie(sessionCookie))
                .andExpect(status().isUnauthorized());
    }

    // 로그인 Validation·CSRF와 ADMIN_LOGIN Challenge Session 미생성 검증
    @Test
    void loginValidationAndAdminBoundaryRemainProtected() throws Exception {
        insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);

        mockMvc.perform(post(LOGIN_PATH)
                        .contentType("application/json")
                        .content(loginBody("admin@example.com", PASSWORD, false)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AUTH_FORBIDDEN"));

        mockMvc.perform(post(LOGIN_PATH)
                        .with(csrf())
                        .contentType("application/json")
                        .content("{\"email\":\"invalid\",\"password\":\"\",\"rememberMe\":false}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_VALIDATION_ERROR"))
                .andExpect(jsonPath("$.fieldErrors.length()").value(2));

        // 앞선 CSRF 차단 과정에서 생성된 익명 Session 격리
        jdbcTemplate.update("DELETE FROM spring_session");

        login("admin@example.com", PASSWORD, false, "198.51.100.60")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false))
                .andExpect(jsonPath("$.adminVerificationRequired").value(true))
                .andExpect(jsonPath("$.challengeId").isNotEmpty())
                .andExpect(jsonPath("$.expiresAt").isNotEmpty())
                .andExpect(jsonPath("$.role").doesNotExist())
                .andExpect(jsonPath("$.redirect").doesNotExist())
                .andExpect(cookie().doesNotExist("PORTFOLIO_SESSION"));
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM spring_session", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM login_logs", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM verification_challenges", Integer.class
        )).isOne();
    }

    private org.springframework.test.web.servlet.ResultActions login(
            String email,
            String password,
            boolean rememberMe,
            String remoteAddress
    ) throws Exception {
        return mockMvc.perform(post(LOGIN_PATH)
                .with(csrf())
                .with(request -> {
                    request.setRemoteAddr(remoteAddress);
                    return request;
                })
                .header("X-Forwarded-For", "203.0.113.99")
                .header(
                        "User-Agent",
                        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                                + "AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36"
                )
                .contentType("application/json")
                .content(loginBody(email, password, rememberMe)));
    }

    private void assertInvalidCredentials(String email, String password, String remoteAddress) throws Exception {
        login(email, password, false, remoteAddress)
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.code").value("AUTH_INVALID_CREDENTIALS"))
                .andExpect(jsonPath("$.message").value("이메일 또는 비밀번호를 확인하세요."));
    }

    private Long insertAccount(String email, String name, String password, String role, boolean enabled) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO accounts (email, name, password_hash, role, enabled)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
                """, Long.class, email, name, passwordEncoder.encode(password), role, enabled);
    }

    private void insertFailures(int count, String fixedEmail, String emailPrefix, String ipAddress) {
        for (int index = 0; index < count; index++) {
            String email = fixedEmail == null ? emailPrefix + index + "@example.com" : fixedEmail;
            jdbcTemplate.update("""
                    INSERT INTO login_logs (
                        occurred_at, account_id, email, event_type, success,
                        failure_reason, ip_address, trace_id
                    )
                    VALUES (CURRENT_TIMESTAMP, NULL, ?, 'LOGIN_FAILURE', FALSE,
                            'INVALID_CREDENTIALS', ?, ?)
                    """, email, ipAddress, "seed-trace-" + index);
        }
    }

    private String lastFailureReason() {
        return jdbcTemplate.queryForObject(
                "SELECT failure_reason FROM login_logs ORDER BY id DESC LIMIT 1",
                String.class
        );
    }

    private String loginBody(String email, String password, boolean rememberMe) {
        return """
                {"email":"%s","password":"%s","rememberMe":%s}
                """.formatted(email, password, rememberMe);
    }
}
