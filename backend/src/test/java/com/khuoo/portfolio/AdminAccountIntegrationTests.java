package com.khuoo.portfolio;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.khuoo.portfolio.account.dto.AccountRoleRequest;
import com.khuoo.portfolio.account.service.AdminAccountService;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
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
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
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
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.reset;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 관리자 계정 조회·생성·변경과 인증 회귀 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestApiConfig.class)
class AdminAccountIntegrationTests extends PostgresIntegrationTest {

    private static final String PASSWORD = "test-password-2026";
    private static final String ACCOUNTS_PATH = "/api/v1/admin/accounts";
    private static final Pattern CODE_PATTERN = Pattern.compile("인증번호: (\\d{6})");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AdminAccountService accountService;

    @MockitoBean
    private JavaMailSender mailSender;

    private final ObjectMapper objectMapper = new ObjectMapper();
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

    // ADMIN 접근과 필터·검색·최근 성공 로그인시각 조회 검증
    @Test
    void accountListSupportsAccessFiltersAndRecentSuccessfulLogin() throws Exception {
        insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        Long aliceId = insertAccount("alice@example.com", "Alice Kim", PASSWORD, "USER", true);
        Long bobId = insertAccount("bob@example.com", "김보라", PASSWORD, "USER", false);
        insertAccount("other-admin@example.com", "다른 관리자", PASSWORD, "ADMIN", true);
        Cookie adminSession = completeAdminLogin("admin@example.com", PASSWORD);
        Cookie userSession = loginUser("alice@example.com", PASSWORD);
        jdbcTemplate.update("DELETE FROM login_logs WHERE account_id = ?", aliceId);

        OffsetDateTime olderSuccess = OffsetDateTime.parse("2026-08-25T10:00:00+09:00");
        OffsetDateTime latestSuccess = OffsetDateTime.parse("2026-08-26T11:00:00+09:00");
        insertLoginLog(aliceId, "alice@example.com", true, null, olderSuccess);
        insertLoginLog(aliceId, "alice@example.com", true, null, latestSuccess);
        insertLoginLog(aliceId, "alice@example.com", false, "INVALID_CREDENTIALS",
                OffsetDateTime.parse("2026-08-27T12:00:00+09:00"));

        mockMvc.perform(get(ACCOUNTS_PATH)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(ACCOUNTS_PATH).cookie(userSession)).andExpect(status().isForbidden());

        MvcResult result = mockMvc.perform(get(ACCOUNTS_PATH).cookie(adminSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items").isArray())
                .andExpect(jsonPath("$.totalElements").doesNotExist())
                .andExpect(jsonPath("$.page").doesNotExist())
                .andReturn();
        JsonNode items = objectMapper.readTree(result.getResponse().getContentAsString()).get("items");
        JsonNode alice = findAccount(items, aliceId);
        JsonNode bob = findAccount(items, bobId);
        assertThat(OffsetDateTime.parse(alice.get("recentLoginAt").asText()).toInstant())
                .isEqualTo(latestSuccess.toInstant());
        assertThat(bob.get("recentLoginAt").isNull()).isTrue();

        mockMvc.perform(get(ACCOUNTS_PATH).cookie(adminSession).param("role", "USER"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2));
        mockMvc.perform(get(ACCOUNTS_PATH).cookie(adminSession).param("role", "ADMIN"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2));
        mockMvc.perform(get(ACCOUNTS_PATH).cookie(adminSession).param("enabled", "false"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(bobId));
        mockMvc.perform(get(ACCOUNTS_PATH).cookie(adminSession).param("keyword", " ALICE "))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(aliceId));
        mockMvc.perform(get(ACCOUNTS_PATH).cookie(adminSession).param("keyword", "보라"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(bobId));
        mockMvc.perform(get(ACCOUNTS_PATH).cookie(adminSession)
                        .param("role", "USER")
                        .param("enabled", "true")
                        .param("keyword", "example.com"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(aliceId));
        mockMvc.perform(get(ACCOUNTS_PATH).cookie(adminSession).param("role", "OWNER"))
                .andExpect(status().isBadRequest());
    }

    // 계정 생성 정책과 ADMIN_ACTION 계정·작업·대상 바인딩 검증
    @Test
    void accountCreationRequiresBoundAdminActionAndSharedPolicy() throws Exception {
        insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        insertAccount("other-admin@example.com", "다른 관리자", PASSWORD, "ADMIN", true);
        insertAccount("caller@example.com", "일반 사용자", PASSWORD, "USER", true);
        Cookie adminSession = completeAdminLogin("admin@example.com", PASSWORD);
        Cookie otherAdminSession = completeAdminLogin("other-admin@example.com", PASSWORD);
        Cookie userSession = loginUser("caller@example.com", PASSWORD);
        String validBody = createBody(" New.User@Example.COM ", "신규 사용자", "initial-password", "USER", null);

        mockMvc.perform(post(ACCOUNTS_PATH).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(validBody))
                .andExpect(status().isUnauthorized());
        ActionChallenge accessChallenge = issueAction(adminSession, "ACCOUNT_CREATE", "ACCOUNT", null);
        mockMvc.perform(post(ACCOUNTS_PATH).cookie(userSession).with(csrf())
                        .headers(actionHeaders(accessChallenge))
                        .contentType(MediaType.APPLICATION_JSON).content(validBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(ACCOUNTS_PATH).cookie(adminSession)
                        .headers(actionHeaders(accessChallenge))
                        .contentType(MediaType.APPLICATION_JSON).content(validBody))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(ACCOUNTS_PATH).cookie(adminSession).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(validBody))
                .andExpect(status().isBadRequest());
        assertThat(accountCount("new.user@example.com")).isZero();

        ActionChallenge wrongOperation = issueAction(adminSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", null);
        createAccount(adminSession, wrongOperation, validBody).andExpect(status().isForbidden());
        ActionChallenge wrongTarget = issueAction(adminSession, "ACCOUNT_CREATE", "PROJECT", null);
        createAccount(adminSession, wrongTarget, validBody).andExpect(status().isForbidden());
        assertThat(accountCount("new.user@example.com")).isZero();

        ActionChallenge otherAdminChallenge = issueAction(adminSession, "ACCOUNT_CREATE", "ACCOUNT", null);
        createAccount(otherAdminSession, otherAdminChallenge, validBody).andExpect(status().isForbidden());

        ActionChallenge createChallenge = issueAction(adminSession, "ACCOUNT_CREATE", "ACCOUNT", null);
        createAccount(adminSession, createChallenge.withCode(wrongCode(createChallenge.code())), validBody)
                .andExpect(status().isForbidden());
        assertThat(challengeAttempts(createChallenge.id())).isOne();
        MvcResult createdResult = createAccount(adminSession, createChallenge, validBody)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("new.user@example.com"))
                .andExpect(jsonPath("$.role").value("USER"))
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.createdAt").isNotEmpty())
                .andExpect(jsonPath("$.password").doesNotExist())
                .andExpect(jsonPath("$.passwordHash").doesNotExist())
                .andExpect(jsonPath("$.updatedAt").doesNotExist())
                .andReturn();
        Long createdId = objectMapper.readTree(createdResult.getResponse().getContentAsString()).get("id").asLong();
        assertThat(passwordEncoder.matches("initial-password", passwordHash(createdId))).isTrue();

        createAccount(adminSession, createChallenge,
                createBody("reuse@example.com", "재사용", PASSWORD, "USER", true))
                .andExpect(status().isForbidden());
        assertThat(accountCount("reuse@example.com")).isZero();

        ActionChallenge adminCreate = issueAction(adminSession, "ACCOUNT_CREATE", "ACCOUNT", null);
        createAccount(adminSession, adminCreate,
                createBody("created-admin@example.com", "생성 관리자", PASSWORD, "ADMIN", false))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.role").value("ADMIN"))
                .andExpect(jsonPath("$.enabled").value(false));

        createAccount(adminSession, adminCreate,
                createBody(" NEW.USER@example.com ", "중복", PASSWORD, "USER", true))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ACCOUNT_EMAIL_CONFLICT"));

        assertCreateValidation(adminSession, "invalid", PASSWORD, "USER");
        assertCreateValidation(adminSession, "valid@example.com", "1234567", "USER");
        assertCreateValidation(adminSession, "valid@example.com", "x".repeat(65), "USER");
        assertCreateValidation(adminSession, "valid@example.com", " leading-space", "USER");
        assertCreateValidation(adminSession, "same@example.com", "same@example.com", "USER");
        assertCreateValidation(adminSession, "valid@example.com", PASSWORD, "OWNER");
    }

    // 활성 상태 변경과 실제 변경 시 대상 Session 선택 폐기 검증
    @Test
    void statusChangeExpiresTargetSessionsAndSupportsNoOp() throws Exception {
        insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        Long targetId = insertAccount("target@example.com", "대상", PASSWORD, "USER", true);
        Long otherId = insertAccount("other@example.com", "다른 사용자", PASSWORD, "USER", true);
        Cookie adminSession = completeAdminLogin("admin@example.com", PASSWORD);
        Cookie targetSessionA = loginUser("target@example.com", PASSWORD);
        Cookie targetSessionB = loginUser("target@example.com", PASSWORD);
        Cookie otherSession = loginUser("other@example.com", PASSWORD);

        ActionChallenge accessChallenge = issueAction(
                adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", targetId.toString());
        mockMvc.perform(patch(ACCOUNTS_PATH + "/" + targetId + "/status")
                        .cookie(targetSessionA)
                        .with(csrf())
                        .headers(actionHeaders(accessChallenge))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());
        mockMvc.perform(patch(ACCOUNTS_PATH + "/" + targetId + "/status")
                        .cookie(adminSession)
                        .headers(actionHeaders(accessChallenge))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());

        ActionChallenge wrongTarget = issueAction(
                adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", otherId.toString());
        changeStatus(adminSession, targetId, wrongTarget, false).andExpect(status().isForbidden());
        assertThat(accountEnabled(targetId)).isTrue();

        ActionChallenge wrongOperation = issueAction(
                adminSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", targetId.toString());
        changeStatus(adminSession, targetId, wrongOperation, false).andExpect(status().isForbidden());

        ActionChallenge expired = issueAction(
                adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", targetId.toString());
        jdbcTemplate.update(
                "UPDATE verification_challenges SET expires_at = CURRENT_TIMESTAMP - INTERVAL '1 second' WHERE id = ?",
                expired.id()
        );
        changeStatus(adminSession, targetId, expired, false).andExpect(status().isForbidden());

        ActionChallenge locked = issueAction(
                adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", targetId.toString());
        jdbcTemplate.update("UPDATE verification_challenges SET status = 'LOCKED' WHERE id = ?", locked.id());
        changeStatus(adminSession, targetId, locked, false).andExpect(status().isForbidden());

        ActionChallenge replaced = issueAction(
                adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", targetId.toString());
        issueAction(adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", targetId.toString());
        changeStatus(adminSession, targetId, replaced, false).andExpect(status().isForbidden());

        ActionChallenge wrongCode = issueAction(
                adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", targetId.toString());
        changeStatus(adminSession, targetId, wrongCode.withCode(wrongCode(wrongCode.code())), false)
                .andExpect(status().isForbidden());
        assertThat(challengeAttempts(wrongCode.id())).isOne();

        ActionChallenge disable = issueAction(
                adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", targetId.toString());
        changeStatus(adminSession, targetId, disable, false)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
        assertThat(sessionCount(targetId)).isZero();
        assertThat(sessionCount(otherId)).isOne();
        mockMvc.perform(get("/api/v1/auth/me").cookie(targetSessionA)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/auth/me").cookie(targetSessionB)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/auth/me").cookie(otherSession)).andExpect(status().isOk());
        login("target@example.com", PASSWORD).andExpect(status().isUnauthorized());

        ActionChallenge enable = issueAction(
                adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", targetId.toString());
        changeStatus(adminSession, targetId, enable, true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));
        Cookie restoredSession = loginUser("target@example.com", PASSWORD);

        ActionChallenge noOp = issueAction(
                adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", targetId.toString());
        changeStatus(adminSession, targetId, noOp, true).andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/auth/me").cookie(restoredSession)).andExpect(status().isOk());

        ActionChallenge missing = issueAction(adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", "999999");
        changeStatus(adminSession, 999999L, missing, false)
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("ACCOUNT_NOT_FOUND"));
    }

    // 권한 변경 후 과거 Authority Session 폐기와 재로그인 권한 반영 검증
    @Test
    void roleChangeExpiresOldAuthoritySessions() throws Exception {
        insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        Long targetId = insertAccount("target@example.com", "대상", PASSWORD, "USER", true);
        Cookie adminSession = completeAdminLogin("admin@example.com", PASSWORD);
        Cookie oldUserSession = loginUser("target@example.com", PASSWORD);

        ActionChallenge promote = issueAction(
                adminSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", targetId.toString());
        changeRole(adminSession, targetId, promote, "ADMIN")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("ADMIN"));
        assertThat(sessionCount(targetId)).isZero();
        mockMvc.perform(get("/api/v1/auth/me").cookie(oldUserSession)).andExpect(status().isUnauthorized());
        Cookie targetAdminSession = completeAdminLogin("target@example.com", PASSWORD);
        mockMvc.perform(get("/api/v1/admin/test").cookie(targetAdminSession)).andExpect(status().isOk());

        ActionChallenge wrongTarget = issueAction(
                adminSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", "999999");
        changeRole(adminSession, targetId, wrongTarget, "USER").andExpect(status().isForbidden());

        ActionChallenge demote = issueAction(
                adminSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", targetId.toString());
        changeRole(adminSession, targetId, demote, "USER")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.role").value("USER"));
        mockMvc.perform(get("/api/v1/auth/me").cookie(targetAdminSession)).andExpect(status().isUnauthorized());
        Cookie newUserSession = loginUser("target@example.com", PASSWORD);
        mockMvc.perform(get("/api/v1/admin/test").cookie(newUserSession)).andExpect(status().isForbidden());

        ActionChallenge noOp = issueAction(
                adminSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", targetId.toString());
        changeRole(adminSession, targetId, noOp, "USER").andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/auth/me").cookie(newUserSession)).andExpect(status().isOk());

        ActionChallenge missing = issueAction(adminSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", "999999");
        changeRole(adminSession, 999999L, missing, "USER")
                .andExpect(status().isNotFound());
    }

    // 마지막 활성 ADMIN 보호와 차단 시 계정·Session·Challenge 유지 검증
    @Test
    void lastActiveAdminCannotBeDisabledOrDemoted() throws Exception {
        Long adminId = insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        Cookie adminSession = completeAdminLogin("admin@example.com", PASSWORD);

        ActionChallenge disable = issueAction(
                adminSession, "ACCOUNT_STATUS_UPDATE", "ACCOUNT", adminId.toString());
        changeStatus(adminSession, adminId, disable, false)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LAST_ADMIN_PROTECTED"));
        assertThat(accountEnabled(adminId)).isTrue();
        assertThat(challengeStatus(disable.id())).isEqualTo("ACTIVE");
        mockMvc.perform(get("/api/v1/auth/me").cookie(adminSession)).andExpect(status().isOk());

        ActionChallenge demote = issueAction(
                adminSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", adminId.toString());
        changeRole(adminSession, adminId, demote, "USER")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("ACCOUNT_LAST_ADMIN_PROTECTED"));
        assertThat(accountRole(adminId)).isEqualTo("ADMIN");

        insertAccount("second-admin@example.com", "두 번째 관리자", PASSWORD, "ADMIN", true);
        ActionChallenge allowed = issueAction(
                adminSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", adminId.toString());
        changeRole(adminSession, adminId, allowed, "USER").andExpect(status().isOk());
        assertThat(activeAdminCount()).isOne();
    }

    // 활성 ADMIN 두 명의 동시 강등에서도 최소 한 명 유지 검증
    @Test
    void concurrentDemotionPreservesOneActiveAdmin() throws Exception {
        Long firstId = insertAccount("first@example.com", "첫 관리자", PASSWORD, "ADMIN", true);
        Long secondId = insertAccount("second@example.com", "둘 관리자", PASSWORD, "ADMIN", true);
        Cookie firstSession = completeAdminLogin("first@example.com", PASSWORD);
        Cookie secondSession = completeAdminLogin("second@example.com", PASSWORD);
        ActionChallenge firstChallenge = issueAction(
                firstSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", firstId.toString());
        ActionChallenge secondChallenge = issueAction(
                secondSession, "ACCOUNT_ROLE_UPDATE", "ACCOUNT", secondId.toString());
        AccountPrincipal first = new AccountPrincipal(firstId, "first@example.com", "첫 관리자", AccountRole.ADMIN);
        AccountPrincipal second = new AccountPrincipal(secondId, "second@example.com", "둘 관리자", AccountRole.ADMIN);

        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        AtomicInteger successes = new AtomicInteger();
        try (ExecutorService executor = Executors.newFixedThreadPool(2)) {
            Future<?> firstFuture = executor.submit(() -> demoteConcurrently(
                    firstId, first, firstChallenge, ready, start, successes));
            Future<?> secondFuture = executor.submit(() -> demoteConcurrently(
                    secondId, second, secondChallenge, ready, start, successes));
            assertThat(ready.await(5, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            firstFuture.get(10, TimeUnit.SECONDS);
            secondFuture.get(10, TimeUnit.SECONDS);
        }

        assertThat(successes.get()).isOne();
        assertThat(activeAdminCount()).isOne();
    }

    // 관리자 비밀번호 초기화와 대상·자기 자신 전체 Session 폐기 검증
    @Test
    void passwordResetUsesPolicyBoundChallengeAndExpiresSessions() throws Exception {
        Long adminId = insertAccount("admin@example.com", "관리자", PASSWORD, "ADMIN", true);
        Long targetId = insertAccount("target@example.com", "대상", PASSWORD, "USER", true);
        Long otherId = insertAccount("other@example.com", "다른 사용자", PASSWORD, "USER", true);
        Cookie adminSession = completeAdminLogin("admin@example.com", PASSWORD);
        Cookie targetSessionA = loginUser("target@example.com", PASSWORD);
        Cookie targetSessionB = loginUser("target@example.com", PASSWORD);
        Cookie otherSession = loginUser("other@example.com", PASSWORD);

        ActionChallenge policyChallenge = issueAction(
                adminSession, "ACCOUNT_PASSWORD_RESET", "ACCOUNT", targetId.toString());
        resetPassword(adminSession, targetId, policyChallenge, " leading-space")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AUTH_PASSWORD_POLICY"));
        resetPassword(adminSession, targetId, policyChallenge, "target@example.com")
                .andExpect(status().isBadRequest());
        assertThat(challengeStatus(policyChallenge.id())).isEqualTo("ACTIVE");

        ActionChallenge wrongTarget = issueAction(
                adminSession, "ACCOUNT_PASSWORD_RESET", "ACCOUNT", otherId.toString());
        resetPassword(adminSession, targetId, wrongTarget, "changed-password-2026")
                .andExpect(status().isForbidden());

        ActionChallenge reset = issueAction(
                adminSession, "ACCOUNT_PASSWORD_RESET", "ACCOUNT", targetId.toString());
        resetPassword(adminSession, targetId, reset, "changed-password-2026")
                .andExpect(status().isNoContent());
        assertThat(passwordEncoder.matches("changed-password-2026", passwordHash(targetId))).isTrue();
        assertThat(sessionCount(targetId)).isZero();
        assertThat(sessionCount(otherId)).isOne();
        mockMvc.perform(get("/api/v1/auth/me").cookie(targetSessionA)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/auth/me").cookie(targetSessionB)).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/auth/me").cookie(otherSession)).andExpect(status().isOk());
        login("target@example.com", PASSWORD).andExpect(status().isUnauthorized());
        loginUser("target@example.com", "changed-password-2026");
        resetPassword(adminSession, targetId, reset, "another-password-2026")
                .andExpect(status().isForbidden());

        ActionChallenge missing = issueAction(
                adminSession, "ACCOUNT_PASSWORD_RESET", "ACCOUNT", "999999");
        resetPassword(adminSession, 999999L, missing, "changed-password-2026")
                .andExpect(status().isNotFound());

        ActionChallenge selfReset = issueAction(
                adminSession, "ACCOUNT_PASSWORD_RESET", "ACCOUNT", adminId.toString());
        resetPassword(adminSession, adminId, selfReset, "admin-changed-2026")
                .andExpect(status().isNoContent());
        mockMvc.perform(get("/api/v1/auth/me").cookie(adminSession)).andExpect(status().isUnauthorized());
        assertThat(sessionCount(adminId)).isZero();
        login("admin@example.com", PASSWORD).andExpect(status().isUnauthorized());
        login("admin@example.com", "admin-changed-2026").andExpect(status().isOk());
    }

    private void demoteConcurrently(
            Long accountId,
            AccountPrincipal principal,
            ActionChallenge challenge,
            CountDownLatch ready,
            CountDownLatch start,
            AtomicInteger successes
    ) {
        try {
            ready.countDown();
            start.await();
            accountService.changeRole(
                    accountId,
                    new AccountRoleRequest(AccountRole.USER),
                    principal,
                    challenge.id(),
                    challenge.code()
            );
            successes.incrementAndGet();
        } catch (ApiException ignored) {
            // 마지막 활성 ADMIN 보호에 따른 동시 요청 하나의 정상 차단
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
        }
    }

    private ActionChallenge issueAction(
            Cookie adminSession,
            String operation,
            String targetType,
            String targetId
    ) throws Exception {
        String target = targetId == null ? "" : ",\"targetId\":\"" + targetId + "\"";
        MvcResult result = mockMvc.perform(post("/api/v1/admin/auth/challenges")
                        .cookie(adminSession)
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"operation":"%s","targetType":"%s"%s}
                                """.formatted(operation, targetType, target)))
                .andExpect(status().isOk())
                .andReturn();
        UUID challengeId = UUID.fromString(
                objectMapper.readTree(result.getResponse().getContentAsString()).get("challengeId").asText()
        );
        return new ActionChallenge(challengeId, latestCode());
    }

    private org.springframework.http.HttpHeaders actionHeaders(ActionChallenge challenge) {
        org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
        headers.add(PortfolioConstants.Header.ADMIN_CHALLENGE_ID, challenge.id().toString());
        headers.add(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE, challenge.code());
        return headers;
    }

    private org.springframework.test.web.servlet.ResultActions createAccount(
            Cookie adminSession,
            ActionChallenge challenge,
            String body
    ) throws Exception {
        return mockMvc.perform(post(ACCOUNTS_PATH)
                .cookie(adminSession)
                .with(csrf())
                .headers(actionHeaders(challenge))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private org.springframework.test.web.servlet.ResultActions changeStatus(
            Cookie adminSession,
            Long accountId,
            ActionChallenge challenge,
            boolean enabled
    ) throws Exception {
        return mockMvc.perform(patch(ACCOUNTS_PATH + "/" + accountId + "/status")
                .cookie(adminSession)
                .with(csrf())
                .headers(actionHeaders(challenge))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":" + enabled + "}"));
    }

    private org.springframework.test.web.servlet.ResultActions changeRole(
            Cookie adminSession,
            Long accountId,
            ActionChallenge challenge,
            String role
    ) throws Exception {
        return mockMvc.perform(patch(ACCOUNTS_PATH + "/" + accountId + "/role")
                .cookie(adminSession)
                .with(csrf())
                .headers(actionHeaders(challenge))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"" + role + "\"}"));
    }

    private org.springframework.test.web.servlet.ResultActions resetPassword(
            Cookie adminSession,
            Long accountId,
            ActionChallenge challenge,
            String newPassword
    ) throws Exception {
        return mockMvc.perform(patch(ACCOUNTS_PATH + "/" + accountId + "/password")
                .cookie(adminSession)
                .with(csrf())
                .headers(actionHeaders(challenge))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"newPassword\":\"" + newPassword + "\"}"));
    }

    private void assertCreateValidation(
            Cookie adminSession,
            String email,
            String password,
            String role
    ) throws Exception {
        mockMvc.perform(post(ACCOUNTS_PATH)
                        .cookie(adminSession)
                        .with(csrf())
                        .header(PortfolioConstants.Header.ADMIN_CHALLENGE_ID, UUID.randomUUID())
                        .header(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE, "123456")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(createBody(email, "검증 대상", password, role, true)))
                .andExpect(status().isBadRequest());
    }

    private Cookie completeAdminLogin(String email, String password) throws Exception {
        MvcResult loginResult = login(email, password).andExpect(status().isOk()).andReturn();
        UUID challengeId = UUID.fromString(
                objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("challengeId").asText()
        );
        MvcResult verifyResult = mockMvc.perform(post("/api/v1/auth/admin-login/verify")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"challengeId":"%s","code":"%s"}
                                """.formatted(challengeId, latestCode())))
                .andExpect(status().isOk())
                .andReturn();
        return verifyResult.getResponse().getCookie("PORTFOLIO_SESSION");
    }

    private Cookie loginUser(String email, String password) throws Exception {
        return login(email, password)
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getCookie("PORTFOLIO_SESSION");
    }

    private org.springframework.test.web.servlet.ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/api/v1/auth/login")
                .with(csrf())
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {"email":"%s","password":"%s","rememberMe":false}
                        """.formatted(email, password)));
    }

    private Long insertAccount(String email, String name, String password, String role, boolean enabled) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO accounts (email, name, password_hash, role, enabled)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
                """, Long.class, email, name, passwordEncoder.encode(password), role, enabled);
    }

    private void insertLoginLog(
            Long accountId,
            String email,
            boolean success,
            String failureReason,
            OffsetDateTime occurredAt
    ) {
        jdbcTemplate.update("""
                INSERT INTO login_logs (
                    occurred_at, account_id, email, event_type, success,
                    failure_reason, ip_address, trace_id
                )
                VALUES (?, ?, ?, ?, ?, ?, '127.0.0.1', ?)
                """,
                occurredAt,
                accountId,
                email,
                success ? "LOGIN_SUCCESS" : "LOGIN_FAILURE",
                success,
                failureReason,
                UUID.randomUUID().toString()
        );
    }

    private JsonNode findAccount(JsonNode items, Long accountId) {
        for (JsonNode item : items) {
            if (item.get("id").asLong() == accountId) {
                return item;
            }
        }
        throw new AssertionError("계정 목록 항목 없음: " + accountId);
    }

    private String createBody(
            String email,
            String name,
            String password,
            String role,
            Boolean enabled
    ) {
        String enabledField = enabled == null ? "" : ",\"enabled\":" + enabled;
        return """
                {"email":"%s","name":"%s","password":"%s","role":"%s"%s}
                """.formatted(email, name, password, role, enabledField);
    }

    private String latestCode() {
        assertThat(sentMessages).isNotEmpty();
        Matcher matcher = CODE_PATTERN.matcher(sentMessages.getLast().getText());
        assertThat(matcher.find()).isTrue();
        return matcher.group(1);
    }

    private String wrongCode(String code) {
        return code.equals("000000") ? "999999" : "000000";
    }

    private int accountCount(String email) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM accounts WHERE email = ?", Integer.class, email);
    }

    private int sessionCount(Long accountId) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM spring_session WHERE principal_name = ?",
                Integer.class,
                accountId.toString()
        );
    }

    private int challengeAttempts(UUID challengeId) {
        return jdbcTemplate.queryForObject(
                "SELECT failed_attempts FROM verification_challenges WHERE id = ?",
                Integer.class,
                challengeId
        );
    }

    private String challengeStatus(UUID challengeId) {
        return jdbcTemplate.queryForObject(
                "SELECT status FROM verification_challenges WHERE id = ?",
                String.class,
                challengeId
        );
    }

    private boolean accountEnabled(Long accountId) {
        return jdbcTemplate.queryForObject(
                "SELECT enabled FROM accounts WHERE id = ?", Boolean.class, accountId);
    }

    private String accountRole(Long accountId) {
        return jdbcTemplate.queryForObject(
                "SELECT role FROM accounts WHERE id = ?", String.class, accountId);
    }

    private String passwordHash(Long accountId) {
        return jdbcTemplate.queryForObject(
                "SELECT password_hash FROM accounts WHERE id = ?", String.class, accountId);
    }

    private int activeAdminCount() {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM accounts WHERE role = 'ADMIN' AND enabled = TRUE",
                Integer.class
        );
    }

    private void clearData() {
        sentMessages.clear();
        jdbcTemplate.update("DELETE FROM spring_session");
        jdbcTemplate.update("DELETE FROM login_logs");
        jdbcTemplate.update("DELETE FROM verification_challenges");
        jdbcTemplate.update("DELETE FROM accounts");
    }

    private record ActionChallenge(UUID id, String code) {

        private ActionChallenge withCode(String newCode) {
            return new ActionChallenge(id, newCode);
        }
    }
}
