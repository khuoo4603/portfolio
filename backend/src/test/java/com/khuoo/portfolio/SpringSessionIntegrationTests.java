package com.khuoo.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.session.Session;
import org.springframework.session.SessionRepository;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

// Flyway Session Table 기반 JDBC 저장 통합 검증
@SpringBootTest
class SpringSessionIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private Environment environment;

    // Session과 Attribute 실제 저장 및 Cascade 삭제 검증
    @Test
    @SuppressWarnings("unchecked")
    void sessionIsStoredInExistingFlywayTables() {
        Session session = sessionRepository.createSession();
        session.setAttribute("test.attribute", "stored-value");
        sessionRepository.save(session);

        assertThat(session.getMaxInactiveInterval()).isEqualTo(Duration.ofHours(8));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM spring_session WHERE session_id = ?",
                Integer.class,
                session.getId()
        )).isOne();
        assertThat(jdbcTemplate.queryForObject(
                """
                        SELECT COUNT(*)
                        FROM spring_session_attributes AS attributes
                        JOIN spring_session AS session
                          ON session.primary_id = attributes.session_primary_id
                        WHERE session.session_id = ?
                          AND attributes.attribute_name = 'test.attribute'
                        """,
                Integer.class,
                session.getId()
        )).isOne();

        sessionRepository.deleteById(session.getId());

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM spring_session WHERE session_id = ?",
                Integer.class,
                session.getId()
        )).isZero();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM spring_session_attributes",
                Integer.class
        )).isZero();
        assertThat(environment.getProperty("spring.session.jdbc.initialize-schema")).isEqualTo("never");
        assertThat(environment.getProperty("server.servlet.session.cookie.name")).isEqualTo("PORTFOLIO_SESSION");
        assertThat(environment.getProperty("server.servlet.session.cookie.http-only", Boolean.class)).isTrue();
        assertThat(environment.getProperty("server.servlet.session.cookie.same-site")).isEqualTo("Lax");
        assertThat(environment.getProperty("server.servlet.session.timeout")).isEqualTo("8h");
    }
}
