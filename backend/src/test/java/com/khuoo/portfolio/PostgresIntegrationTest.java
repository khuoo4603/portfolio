package com.khuoo.portfolio;

import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;

// 통합 테스트 공용 PostgreSQL 16 실행 기반
public abstract class PostgresIntegrationTest {

    protected static final PostgreSQLContainer postgres;

    static {
        postgres = new PostgreSQLContainer("postgres:16-alpine");
        postgres.start();
    }

    @Autowired
    private JdbcTemplate jdbcTemplate;

    // Testcontainers PostgreSQL 연결 정보 등록
    @DynamicPropertySource
    static void postgresProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.datasource.hikari.maximum-pool-size", () -> 4);
        registry.add("spring.datasource.hikari.minimum-idle", () -> 0);
        registry.add("logging.file.path", () -> "build/test-logs");
    }

    // 테스트 간 JDBC Session 및 오류 요약 데이터 격리
    @AfterEach
    void clearSessions() {
        jdbcTemplate.update("DELETE FROM spring_session");
        jdbcTemplate.update("DELETE FROM error_logs");
    }
}
