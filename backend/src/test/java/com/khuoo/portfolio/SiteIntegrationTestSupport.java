package com.khuoo.portfolio;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import tools.jackson.databind.ObjectMapper;

import javax.sql.DataSource;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

// Site 통합 테스트의 PostgreSQL 데이터 격리와 인증·Challenge 공통 기반
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
abstract class SiteIntegrationTestSupport extends PostgresIntegrationTest {

    protected static final String CODE = "123456";

    @Autowired
    protected JdbcTemplate jdbcTemplate;

    @Autowired
    protected PasswordEncoder passwordEncoder;

    @Autowired
    protected ObjectMapper objectMapper;

    @Autowired
    private DataSource dataSource;

    protected AccountPrincipal adminPrincipal;
    protected AccountPrincipal userPrincipal;

    // Site 업무 데이터 초기화와 ADMIN·USER 테스트 계정 구성
    @BeforeEach
    void setUpSiteData() {
        clearSiteData();
        Long adminId = insertAccount("site-admin@example.com", "사이트 관리자", AccountRole.ADMIN);
        Long userId = insertAccount("site-user@example.com", "사이트 사용자", AccountRole.USER);
        adminPrincipal = new AccountPrincipal(adminId, "site-admin@example.com", "사이트 관리자", AccountRole.ADMIN);
        userPrincipal = new AccountPrincipal(userId, "site-user@example.com", "사이트 사용자", AccountRole.USER);
    }

    // 공용 Testcontainers DB의 기존 Seed 원상복구
    @AfterEach
    void restoreSeedData() {
        clearSiteData();
        jdbcTemplate.update("DELETE FROM tool_links");
        jdbcTemplate.update("DELETE FROM tools");

        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.setSqlScriptEncoding("UTF-8");
        populator.addScript(new ClassPathResource("db/migration/V2__seed_initial_data.sql"));
        populator.execute(dataSource);
    }

    // ADMIN 인증 주체 MockMvc 적용
    protected RequestPostProcessor admin() {
        return authentication(adminPrincipal);
    }

    // USER 인증 주체 MockMvc 적용
    protected RequestPostProcessor user() {
        return authentication(userPrincipal);
    }

    // 지정 계정·작업·대상에 바인딩된 ADMIN_ACTION Challenge 생성
    protected ActionChallenge challenge(String operation, String targetType, String targetId) {
        return challenge(adminPrincipal.id(), operation, targetType, targetId, "ACTIVE", OffsetDateTime.now().plusMinutes(10));
    }

    // 상태·만료시각을 지정한 ADMIN_ACTION Challenge 생성
    protected ActionChallenge challenge(
            Long accountId,
            String operation,
            String targetType,
            String targetId,
            String status,
            OffsetDateTime expiresAt
    ) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update("""
                INSERT INTO verification_challenges (
                    id, account_id, purpose, operation, target_type, target_id,
                    code_hash, status, expires_at
                )
                VALUES (?, ?, 'ADMIN_ACTION', ?, ?, ?, ?, ?, ?)
                """,
                id,
                accountId,
                operation,
                targetType,
                targetId,
                passwordEncoder.encode(CODE),
                status,
                expiresAt
        );
        return new ActionChallenge(id, CODE);
    }

    // 관리자 작업 인증 Header 구성
    protected HttpHeaders actionHeaders(ActionChallenge challenge) {
        HttpHeaders headers = new HttpHeaders();
        headers.add(PortfolioConstants.Header.ADMIN_CHALLENGE_ID, challenge.id().toString());
        headers.add(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE, challenge.code());
        return headers;
    }

    // Challenge 현재 상태 조회
    protected String challengeStatus(UUID challengeId) {
        return jdbcTemplate.queryForObject(
                "SELECT status FROM verification_challenges WHERE id = ?",
                String.class,
                challengeId
        );
    }

    // 테스트 계정 추가와 식별자 반환
    protected Long insertAccount(String email, String name, AccountRole role) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO accounts (email, name, password_hash, role, enabled)
                VALUES (?, ?, ?, ?, TRUE)
                RETURNING id
                """,
                Long.class,
                email,
                name,
                passwordEncoder.encode("test-password-2026"),
                role.name()
        );
    }

    // Site·인증 테스트 데이터의 FK 순서 기반 초기화
    protected void clearSiteData() {
        jdbcTemplate.update("DELETE FROM spring_session");
        jdbcTemplate.update("DELETE FROM login_logs");
        jdbcTemplate.update("DELETE FROM verification_challenges");
        jdbcTemplate.update("DELETE FROM project_media");
        jdbcTemplate.update("DELETE FROM project_contents");
        jdbcTemplate.update("DELETE FROM project_technologies");
        jdbcTemplate.update("DELETE FROM portfolio_technologies");
        jdbcTemplate.update("DELETE FROM resume_files");
        jdbcTemplate.update("DELETE FROM projects");
        jdbcTemplate.update("DELETE FROM technology_master");
        jdbcTemplate.update("DELETE FROM profile_entries");
        jdbcTemplate.update("DELETE FROM external_links");
        jdbcTemplate.update("DELETE FROM portfolio_contents");
        jdbcTemplate.update("DELETE FROM accounts");
    }

    private RequestPostProcessor authentication(AccountPrincipal principal) {
        UsernamePasswordAuthenticationToken token = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + principal.role().name()))
        );
        return SecurityMockMvcRequestPostProcessors.authentication(token);
    }

    protected record ActionChallenge(UUID id, String code) {

        // 인증번호 오류 시나리오용 Challenge 복사
        protected ActionChallenge withCode(String newCode) {
            return new ActionChallenge(id, newCode);
        }
    }
}
