package com.khuoo.portfolio;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

// Monitoring Fresh Baseline 검증
class MonitoringMigrationTests {

    // V1과 V2 적용 Fresh Database Monitoring Seed 검증
    @Test
    void freshBaselineCreatesRuntimeConfigAndServiceStatus() throws SQLException {
        String schema = "monitoring_upgrade_" + UUID.randomUUID().toString().replace("-", "");
        Flyway versionTwo = flyway(schema, "2");
        assertThat(versionTwo.migrate().migrationsExecuted).isEqualTo(2);

        try (Connection connection = connection(schema); Statement statement = connection.createStatement()) {
            statement.executeUpdate("""
                    INSERT INTO service_status (
                        service_key, status, response_time_ms, http_status, last_checked_at
                    ) VALUES ('PORTFOLIO_BACKEND', 'UP', 42, 200, CURRENT_TIMESTAMP)
                    """);
        }

        assertThat(flyway(schema, null).migrate().migrationsExecuted).isZero();

        try (Connection connection = connection(schema); Statement statement = connection.createStatement()) {
            try (ResultSet settings = statement.executeQuery("""
                    SELECT enabled, check_interval_seconds, connect_timeout_ms,
                           request_timeout_ms, retry_delay_ms, max_retries
                    FROM monitoring_settings
                    WHERE id = 1
                    """)) {
                assertThat(settings.next()).isTrue();
                assertThat(settings.getBoolean("enabled")).isTrue();
                assertThat(settings.getInt("check_interval_seconds")).isEqualTo(300);
                assertThat(settings.getInt("connect_timeout_ms")).isEqualTo(2000);
                assertThat(settings.getInt("request_timeout_ms")).isEqualTo(3000);
                assertThat(settings.getInt("retry_delay_ms")).isEqualTo(500);
                assertThat(settings.getInt("max_retries")).isOne();
            }
            org.assertj.core.api.Assertions.assertThatThrownBy(() -> statement.executeUpdate("""
                    INSERT INTO monitoring_settings (
                        id, enabled, check_interval_seconds, connect_timeout_ms,
                        request_timeout_ms, retry_delay_ms, max_retries
                    ) VALUES (2, TRUE, 300, 2000, 3000, 500, 1)
                    """))
                    .isInstanceOf(SQLException.class);
            try (ResultSet targets = statement.executeQuery("""
                    SELECT service_key, health_url, enabled, display_order
                    FROM monitoring_targets
                    ORDER BY display_order ASC
                    """)) {
                assertThat(targets.next()).isTrue();
                assertThat(targets.getString("service_key")).isEqualTo("PORTFOLIO_FRONTEND");
                assertThat(targets.getString("health_url")).isEqualTo("http://frontend:3000/healthz");
                assertThat(targets.getBoolean("enabled")).isTrue();
                assertThat(targets.getInt("display_order")).isOne();
                assertThat(targets.next()).isTrue();
                assertThat(targets.getString("service_key")).isEqualTo("PORTFOLIO_BACKEND");
                assertThat(targets.getString("health_url")).isEqualTo("http://backend:8080/actuator/health");
                for (int index = 0; index < 4; index++) {
                    assertThat(targets.next()).isTrue();
                    assertThat(targets.getString("health_url")).isNull();
                    assertThat(targets.getBoolean("enabled")).isFalse();
                }
                assertThat(targets.next()).isFalse();
            }
            try (ResultSet status = statement.executeQuery("""
                    SELECT status, response_time_ms, http_status
                    FROM service_status
                    WHERE service_key = 'PORTFOLIO_BACKEND'
                    """)) {
                assertThat(status.next()).isTrue();
                assertThat(status.getString("status")).isEqualTo("UP");
                assertThat(status.getInt("response_time_ms")).isEqualTo(42);
                assertThat(status.getInt("http_status")).isEqualTo(200);
            }
        }
    }

    private Flyway flyway(String schema, String target) {
        var configuration = Flyway.configure()
                .dataSource(
                        PostgresIntegrationTest.postgres.getJdbcUrl(),
                        PostgresIntegrationTest.postgres.getUsername(),
                        PostgresIntegrationTest.postgres.getPassword()
                )
                .schemas(schema)
                .defaultSchema(schema)
                .locations("classpath:db/migration");
        if (target != null) {
            configuration.target(target);
        }
        return configuration.load();
    }

    private Connection connection(String schema) throws SQLException {
        Connection connection = DriverManager.getConnection(
                PostgresIntegrationTest.postgres.getJdbcUrl(),
                PostgresIntegrationTest.postgres.getUsername(),
                PostgresIntegrationTest.postgres.getPassword()
        );
        connection.createStatement().execute("SET search_path TO " + schema);
        return connection;
    }
}
