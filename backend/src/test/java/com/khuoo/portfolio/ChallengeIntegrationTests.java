package com.khuoo.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mail.MailSendException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.reset;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// ADMIN_LOGIN·PASSWORD_CHANGE·ADMIN_ACTION Challenge 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApiConfig.class)
class ChallengeIntegrationTests extends PostgresIntegrationTest {

    private static final String PASSWORD = "test-password-2026";
    private static final Pattern CODE_PATTERN = Pattern.compile("인증번호: (\\d{6})");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    private AdminActionVerifier adminActionVerifier;

    @MockitoBean
    private JavaMailSender mailSender;

    private final List<SimpleMailMessage> sentMessages = new ArrayList<>();

    @BeforeEach
    void setUp() {
        clearData();
        reset(mailSender);
        doAnswer(invocation -> {
            sentMessages.add(new SimpleMailMessage(invocation.getArgument(0)));
            return null;
        }).when(mailSender).send(any(SimpleMailMessage.class));
    }

    @AfterEach
    void tearDown() {
        clearData();
    }

    // ADMIN Credential부터 이메일 검증·Session·로그인 기록까지 전체 흐름 검증
    @Test
    void adminLoginRequiresEmailCodeBeforeSessionCreation() throws Exception {
        Long adminId = insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);

        IssuedChallenge issued = issueAdminLogin("admin@example.com", PASSWORD, true);

        assertThat(issued.sessionCookie()).isNull();
        assertThat(issued.code()).matches("\\d{6}");
        assertThat(sentMessages.getLast().getTo()).containsExactly("admin@example.com");
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM spring_session", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM login_logs", Integer.class)).isZero();
        Map<String, Object> challenge = challenge(issued.challengeId());
        assertThat(challenge)
                .containsEntry("account_id", adminId)
                .containsEntry("purpose", "ADMIN_LOGIN")
                .containsEntry("remember_me", true)
                .containsEntry("failed_attempts", 0)
                .containsEntry("status", "ACTIVE");
        String codeHash = (String) challenge.get("code_hash");
        assertThat(codeHash).isNotEqualTo(issued.code()).startsWith("$2a$12$");
        assertThat(passwordEncoder.matches(issued.code(), codeHash)).isTrue();

        MvcResult verifyResult = verifyAdmin(issued.challengeId(), issued.code())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(true))
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.redirect").value("/admin"))
                .andExpect(jsonPath("$.adminVerificationRequired").doesNotExist())
                .andReturn();
        Cookie adminSession = verifyResult.getResponse().getCookie("PORTFOLIO_SESSION");

        assertThat(adminSession).isNotNull();
        assertThat(adminSession.getMaxAge())
                .isEqualTo(PortfolioConstants.Authentication.REMEMBER_ME_SECONDS);
        assertThat(challenge(issued.challengeId())).containsEntry("status", "USED");
        assertThat(jdbcTemplate.queryForMap("""
                SELECT account_id, event_type, success, failure_reason
                FROM login_logs
                """))
                .containsEntry("account_id", adminId)
                .containsEntry("event_type", "LOGIN_SUCCESS")
                .containsEntry("success", true)
                .containsEntry("failure_reason", null);

        mockMvc.perform(get("/api/v1/auth/me").cookie(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
        mockMvc.perform(get("/api/v1/admin/test").cookie(adminSession))
                .andExpect(status().isOk());
        verifyAdmin(issued.challengeId(), issued.code())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_CHALLENGE_INVALID"));
    }

    // ADMIN_LOGIN 인증번호 실패 누적·잠금·만료 Login Log 검증
    @Test
    void adminVerificationPersistsFailuresLockAndExpiration() throws Exception {
        insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        IssuedChallenge issued = issueAdminLogin("admin@example.com", PASSWORD, false);
        String wrongCode = wrongCode(issued.code());

        for (int attempt = 1; attempt <= 4; attempt++) {
            verifyAdmin(issued.challengeId(), wrongCode)
                    .andExpect(status().isUnauthorized())
                    .andExpect(jsonPath("$.code").value("AUTH_VERIFICATION_FAILED"));
            assertThat(challenge(issued.challengeId()))
                    .containsEntry("failed_attempts", attempt)
                    .containsEntry("status", "ACTIVE");
        }

        verifyAdmin(issued.challengeId(), wrongCode)
                .andExpect(status().isLocked())
                .andExpect(jsonPath("$.code").value("AUTH_VERIFICATION_LOCKED"));
        assertThat(challenge(issued.challengeId()))
                .containsEntry("failed_attempts", 5)
                .containsEntry("status", "LOCKED");
        assertThat(jdbcTemplate.queryForList(
                "SELECT failure_reason FROM login_logs ORDER BY id", String.class
        )).containsExactly(
                "VERIFICATION_FAILED",
                "VERIFICATION_FAILED",
                "VERIFICATION_FAILED",
                "VERIFICATION_FAILED",
                "VERIFICATION_LOCKED"
        );
        verifyAdmin(issued.challengeId(), issued.code())
                .andExpect(status().isLocked());

        IssuedChallenge expired = issueAdminLogin("admin@example.com", PASSWORD, false);
        jdbcTemplate.update(
                "UPDATE verification_challenges SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE id = ?",
                expired.challengeId()
        );
        verifyAdmin(expired.challengeId(), expired.code())
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.code").value("AUTH_VERIFICATION_EXPIRED"));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT failure_reason FROM login_logs ORDER BY id DESC LIMIT 1", String.class
        )).isEqualTo("VERIFICATION_EXPIRED");
    }

    // 재전송 대기·교체·rememberMe 승계와 LOCKED 재발급 검증
    @Test
    void adminResendReplacesCodeAndAllowsLockedSource() throws Exception {
        insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        IssuedChallenge issued = issueAdminLogin("admin@example.com", PASSWORD, true);

        resendAdmin(issued.challengeId())
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AUTH_RESEND_TOO_SOON"));

        makeResendable(issued.challengeId());
        MvcResult resendResult = resendAdmin(issued.challengeId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.challengeId").isNotEmpty())
                .andReturn();
        UUID replacementId = UUID.fromString(
                objectMapper.readTree(resendResult.getResponse().getContentAsString()).get("challengeId").asText()
        );
        String replacementCode = latestCode();

        assertThat(replacementId).isNotEqualTo(issued.challengeId());
        assertThat(challenge(issued.challengeId())).containsEntry("status", "REPLACED");
        assertThat(challenge(replacementId))
                .containsEntry("status", "ACTIVE")
                .containsEntry("remember_me", true);
        verifyAdmin(issued.challengeId(), issued.code()).andExpect(status().isBadRequest());
        verifyAdmin(replacementId, replacementCode).andExpect(status().isOk());
        resendAdmin(issued.challengeId()).andExpect(status().isConflict());
        resendAdmin(replacementId).andExpect(status().isConflict());

        IssuedChallenge locked = issueAdminLogin("admin@example.com", PASSWORD, false);
        String wrongCode = wrongCode(locked.code());
        for (int attempt = 0; attempt < 5; attempt++) {
            verifyAdmin(locked.challengeId(), wrongCode);
        }
        makeResendable(locked.challengeId());
        resendAdmin(locked.challengeId())
                .andExpect(status().isOk());
        assertThat(challenge(locked.challengeId())).containsEntry("status", "REPLACED");
    }

    // 시간당 30회 발송 제한과 Mail 실패 Transaction Rollback 검증
    @Test
    void sendLimitAndMailFailureLeaveNoUsableChallenge() throws Exception {
        Long adminId = insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        seedChallenges(adminId, 30);

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody("admin@example.com", PASSWORD, false)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("AUTH_CHALLENGE_RATE_LIMITED"));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM verification_challenges", Integer.class
        )).isEqualTo(30);

        clearData();
        insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        reset(mailSender);
        doThrow(new MailSendException("SMTP 내부정보 외부 노출 금지"))
                .when(mailSender).send(any(SimpleMailMessage.class));

        mockMvc.perform(post("/api/v1/auth/login")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody("admin@example.com", PASSWORD, false)))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("AUTH_MAIL_UNAVAILABLE"))
                .andExpect(jsonPath("$.message").value("인증 이메일을 발송할 수 없습니다."))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString("SMTP"))));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM verification_challenges", Integer.class
        )).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM spring_session", Integer.class)).isZero();
        assertThat(jdbcTemplate.queryForObject("SELECT COUNT(*) FROM login_logs", Integer.class)).isZero();
    }

    // 비밀번호 변경 성공과 동일 계정 전체 Session 선택 폐기 검증
    @Test
    void passwordChangeUpdatesHashAndExpiresOnlyAccountSessions() throws Exception {
        Long userId = insertAccount("user@example.com", "사용자", PASSWORD, "USER", true);
        Long otherId = insertAccount("other@example.com", "다른 사용자", PASSWORD, "USER", true);
        Cookie sessionA = loginUser("user@example.com", PASSWORD);
        Cookie sessionB = loginUser("user@example.com", PASSWORD);
        Cookie otherSession = loginUser("other@example.com", PASSWORD);

        MvcResult challengeResult = mockMvc.perform(post("/api/v1/auth/password/challenge")
                        .cookie(sessionA)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();
        UUID challengeId = responseChallengeId(challengeResult);
        String code = latestCode();
        String newPassword = "changed-password-2026";

        MvcResult changeResult = mockMvc.perform(patch("/api/v1/auth/password")
                        .cookie(sessionA)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(passwordBody(challengeId, code, newPassword)))
                .andExpect(status().isNoContent())
                .andReturn();

        assertThat(changeResult.getResponse().getCookie("PORTFOLIO_SESSION")).isNotNull();
        assertThat(changeResult.getResponse().getCookie("PORTFOLIO_SESSION").getMaxAge()).isZero();
        assertThat(challenge(challengeId)).containsEntry("status", "USED");
        String changedHash = jdbcTemplate.queryForObject(
                "SELECT password_hash FROM accounts WHERE id = ?", String.class, userId
        );
        assertThat(passwordEncoder.matches(newPassword, changedHash)).isTrue();
        assertThat(passwordEncoder.matches(PASSWORD, changedHash)).isFalse();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM spring_session WHERE principal_name = ?",
                Integer.class,
                userId.toString()
        )).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM spring_session WHERE principal_name = ?",
                Integer.class,
                otherId.toString()
        )).isOne();

        mockMvc.perform(get("/api/v1/auth/me").cookie(sessionA)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/auth/me").cookie(sessionB)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/auth/me").cookie(otherSession)).andExpect(status().isOk());
        login("user@example.com", PASSWORD, false).andExpect(status().isUnauthorized());
        login("user@example.com", newPassword, false).andExpect(status().isOk());
    }

    // PASSWORD_CHANGE 비로그인·정책·실패·만료·잠금 검증
    @Test
    void passwordChangeEnforcesAuthenticationPolicyAndChallengeState() throws Exception {
        insertAccount("user@example.com", "사용자", PASSWORD, "USER", true);
        Cookie session = loginUser("user@example.com", PASSWORD);

        mockMvc.perform(post("/api/v1/auth/password/challenge").with(csrf()))
                .andExpect(status().isUnauthorized());
        UUID challengeId = issuePasswordChallenge(session);
        String code = latestCode();

        mockMvc.perform(patch("/api/v1/auth/password")
                        .cookie(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(passwordBody(challengeId, code, " leading-space")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_PASSWORD_POLICY"));
        mockMvc.perform(patch("/api/v1/auth/password")
                        .cookie(session)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(passwordBody(challengeId, code, "user@example.com")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_PASSWORD_POLICY"));
        assertThat(challenge(challengeId)).containsEntry("failed_attempts", 0);

        String wrongCode = wrongCode(code);
        for (int attempt = 1; attempt <= 4; attempt++) {
            changePassword(session, challengeId, wrongCode, "valid-password-2026")
                    .andExpect(status().isUnauthorized());
        }
        changePassword(session, challengeId, wrongCode, "valid-password-2026")
                .andExpect(status().isLocked());
        assertThat(challenge(challengeId))
                .containsEntry("failed_attempts", 5)
                .containsEntry("status", "LOCKED");

        UUID expiredId = issuePasswordChallenge(session);
        String expiredCode = latestCode();
        jdbcTemplate.update(
                "UPDATE verification_challenges SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE id = ?",
                expiredId
        );
        changePassword(session, expiredId, expiredCode, "valid-password-2026")
                .andExpect(status().isGone());
    }

    // ADMIN_ACTION 발급·계정/operation/target 바인딩과 일회성 소모 검증
    @Test
    void adminActionBindsCurrentAdminAndExactOperationTarget() throws Exception {
        Long adminId = insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        Long otherAdminId = insertAccount("other-admin@example.com", "다른 관리자", PASSWORD, "ADMIN", true);
        insertAccount("user@example.com", "사용자", PASSWORD, "USER", true);
        Cookie adminSession = completeAdminLogin("admin@example.com");
        Cookie userSession = loginUser("user@example.com", PASSWORD);

        MvcResult adminPasswordResult = mockMvc.perform(post("/api/v1/auth/password/challenge")
                        .cookie(adminSession)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();
        assertThat(challenge(responseChallengeId(adminPasswordResult)))
                .containsEntry("account_id", adminId)
                .containsEntry("purpose", "PASSWORD_CHANGE");

        mockMvc.perform(post("/api/v1/admin/auth/challenges")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminActionBody()))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post("/api/v1/admin/auth/challenges")
                        .cookie(userSession)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminActionBody()))
                .andExpect(status().isForbidden());

        MvcResult result = mockMvc.perform(post("/api/v1/admin/auth/challenges")
                        .cookie(adminSession)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminActionBody()))
                .andExpect(status().isOk())
                .andReturn();
        UUID challengeId = responseChallengeId(result);
        String code = latestCode();
        assertThat(challenge(challengeId))
                .containsEntry("account_id", adminId)
                .containsEntry("purpose", "ADMIN_ACTION")
                .containsEntry("operation", "PROJECT_UPDATE")
                .containsEntry("target_type", "PROJECT")
                .containsEntry("target_id", "1")
                .containsEntry("remember_me", false);

        AccountPrincipal currentAdmin = new AccountPrincipal(
                adminId, "admin@example.com", "관리자", AccountRole.ADMIN
        );
        AccountPrincipal otherAdmin = new AccountPrincipal(
                otherAdminId, "other-admin@example.com", "다른 관리자", AccountRole.ADMIN
        );
        assertBindingMismatch(otherAdmin, challengeId, code,
                AdminActionOperation.PROJECT_UPDATE, AdminActionTarget.PROJECT, "1");
        assertBindingMismatch(currentAdmin, challengeId, code,
                AdminActionOperation.PROJECT_DELETE, AdminActionTarget.PROJECT, "1");
        assertBindingMismatch(currentAdmin, challengeId, code,
                AdminActionOperation.PROJECT_UPDATE, AdminActionTarget.ACCOUNT, "1");
        assertBindingMismatch(currentAdmin, challengeId, code,
                AdminActionOperation.PROJECT_UPDATE, AdminActionTarget.PROJECT, "2");
        assertThat(challenge(challengeId)).containsEntry("failed_attempts", 0);

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_UPDATE,
                AdminActionTarget.PROJECT,
                "1"
        );
        assertThat(challenge(challengeId)).containsEntry("status", "USED");
        assertThatThrownBy(() -> adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_UPDATE,
                AdminActionTarget.PROJECT,
                "1"
        )).isInstanceOf(ApiException.class);
    }

    // 동일 ADMIN_ACTION Challenge 동시 검증 성공 최대 1회 보장
    @Test
    void concurrentAdminActionVerificationConsumesOnlyOnce() throws Exception {
        Long adminId = insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        Cookie adminSession = completeAdminLogin("admin@example.com");
        MvcResult result = mockMvc.perform(post("/api/v1/admin/auth/challenges")
                        .cookie(adminSession)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(adminActionBody()))
                .andExpect(status().isOk())
                .andReturn();
        UUID challengeId = responseChallengeId(result);
        String code = latestCode();
        AccountPrincipal principal = new AccountPrincipal(
                adminId, "admin@example.com", "관리자", AccountRole.ADMIN
        );

        AtomicInteger successes = new AtomicInteger();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        try {
            List<Future<?>> futures = List.of(
                    executor.submit(() -> verifyConcurrently(start, successes, principal, challengeId, code)),
                    executor.submit(() -> verifyConcurrently(start, successes, principal, challengeId, code))
            );
            start.countDown();
            for (Future<?> future : futures) {
                future.get(10, TimeUnit.SECONDS);
            }
        } finally {
            executor.shutdownNow();
        }

        assertThat(successes.get()).isOne();
        assertThat(challenge(challengeId)).containsEntry("status", "USED");
    }

    private void verifyConcurrently(
            CountDownLatch start,
            AtomicInteger successes,
            AccountPrincipal principal,
            UUID challengeId,
            String code
    ) {
        try {
            start.await(5, TimeUnit.SECONDS);
            adminActionVerifier.verifyAndConsume(
                    principal,
                    challengeId,
                    code,
                    AdminActionOperation.PROJECT_UPDATE,
                    AdminActionTarget.PROJECT,
                    "1"
            );
            successes.incrementAndGet();
        } catch (ApiException ignored) {
            // 동시 요청 중 이미 소모된 Challenge 결과
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }

    private IssuedChallenge issueAdminLogin(String email, String password, boolean rememberMe) throws Exception {
        MvcResult result = login(email, password, rememberMe)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.authenticated").value(false))
                .andExpect(jsonPath("$.adminVerificationRequired").value(true))
                .andExpect(cookie().doesNotExist("PORTFOLIO_SESSION"))
                .andReturn();
        JsonNode response = objectMapper.readTree(result.getResponse().getContentAsString());
        return new IssuedChallenge(
                UUID.fromString(response.get("challengeId").asText()),
                latestCode(),
                result.getResponse().getCookie("PORTFOLIO_SESSION")
        );
    }

    private Cookie completeAdminLogin(String email) throws Exception {
        IssuedChallenge issued = issueAdminLogin(email, PASSWORD, false);
        MvcResult result = verifyAdmin(issued.challengeId(), issued.code())
                .andExpect(status().isOk())
                .andReturn();
        return result.getResponse().getCookie("PORTFOLIO_SESSION");
    }

    private Cookie loginUser(String email, String password) throws Exception {
        MvcResult result = login(email, password, false)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"))
                .andReturn();
        return result.getResponse().getCookie("PORTFOLIO_SESSION");
    }

    private org.springframework.test.web.servlet.ResultActions login(
            String email,
            String password,
            boolean rememberMe
    ) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginBody(email, password, rememberMe)));
    }

    private org.springframework.test.web.servlet.ResultActions verifyAdmin(UUID challengeId, String code)
            throws Exception {
        return mockMvc.perform(post("/api/v1/auth/admin-login/verify")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"challengeId":"%s","code":"%s"}
                        """.formatted(challengeId, code)));
    }

    private org.springframework.test.web.servlet.ResultActions resendAdmin(UUID challengeId) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/admin-login/resend")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"challengeId":"%s"}
                        """.formatted(challengeId)));
    }

    private UUID issuePasswordChallenge(Cookie session) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/v1/auth/password/challenge")
                        .cookie(session)
                        .with(csrf()))
                .andExpect(status().isOk())
                .andReturn();
        return responseChallengeId(result);
    }

    private org.springframework.test.web.servlet.ResultActions changePassword(
            Cookie session,
            UUID challengeId,
            String code,
            String newPassword
    ) throws Exception {
        return mockMvc.perform(patch("/api/v1/auth/password")
                .cookie(session)
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content(passwordBody(challengeId, code, newPassword)));
    }

    private void assertBindingMismatch(
            AccountPrincipal principal,
            UUID challengeId,
            String code,
            AdminActionOperation operation,
            AdminActionTarget targetType,
            String targetId
    ) {
        assertThatThrownBy(() -> adminActionVerifier.verifyAndConsume(
                principal,
                challengeId,
                code,
                operation,
                targetType,
                targetId
        )).isInstanceOfSatisfying(ApiException.class, exception ->
                assertThat(exception.getErrorCode()).isEqualTo(ErrorCode.AUTH_ADMIN_ACTION_MISMATCH));
    }

    private Long insertAccount(String email, String name, String password, String role, boolean enabled) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO accounts (email, name, password_hash, role, enabled)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
                """, Long.class, email, name, passwordEncoder.encode(password), role, enabled);
    }

    private void seedChallenges(Long accountId, int count) {
        String codeHash = passwordEncoder.encode("123456");
        for (int index = 0; index < count; index++) {
            jdbcTemplate.update("""
                    INSERT INTO verification_challenges (
                        id, account_id, purpose, code_hash, remember_me,
                        failed_attempts, status, expires_at, created_at, updated_at
                    )
                    VALUES (?, ?, 'PASSWORD_CHANGE', ?, FALSE, 0, 'REPLACED',
                            CURRENT_TIMESTAMP + INTERVAL '5 minutes', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                    """, UUID.randomUUID(), accountId, codeHash);
        }
    }

    private Map<String, Object> challenge(UUID challengeId) {
        return jdbcTemplate.queryForMap("""
                SELECT account_id, purpose, operation, target_type, target_id,
                       code_hash, remember_me, failed_attempts, status
                FROM verification_challenges
                WHERE id = ?
                """, challengeId);
    }

    private void makeResendable(UUID challengeId) {
        jdbcTemplate.update("""
                UPDATE verification_challenges
                SET created_at = CURRENT_TIMESTAMP - INTERVAL '61 seconds'
                WHERE id = ?
                """, challengeId);
    }

    private UUID responseChallengeId(MvcResult result) throws Exception {
        return UUID.fromString(
                objectMapper.readTree(result.getResponse().getContentAsString()).get("challengeId").asText()
        );
    }

    private String latestCode() {
        assertThat(sentMessages).isNotEmpty();
        String text = sentMessages.getLast().getText();
        Matcher matcher = CODE_PATTERN.matcher(text == null ? "" : text);
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }

    private String wrongCode(String code) {
        return code.equals("000000") ? "000001" : "000000";
    }

    private String loginBody(String email, String password, boolean rememberMe) {
        return """
                {"email":"%s","password":"%s","rememberMe":%s}
                """.formatted(email, password, rememberMe);
    }

    private String passwordBody(UUID challengeId, String code, String newPassword) {
        return """
                {"challengeId":"%s","code":"%s","newPassword":"%s"}
                """.formatted(challengeId, code, newPassword);
    }

    private String adminActionBody() {
        return """
                {"operation":"PROJECT_UPDATE","targetType":"PROJECT","targetId":"1"}
                """;
    }

    private void clearData() {
        sentMessages.clear();
        jdbcTemplate.update("DELETE FROM spring_session");
        jdbcTemplate.update("DELETE FROM login_logs");
        jdbcTemplate.update("DELETE FROM verification_challenges");
        jdbcTemplate.update("DELETE FROM accounts");
    }

    private record IssuedChallenge(UUID challengeId, String code, Cookie sessionCookie) {
    }
}
