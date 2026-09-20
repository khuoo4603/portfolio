package com.khuoo.portfolio;

import com.khuoo.portfolio.monitoring.scheduler.MonitoringScheduler;
import com.khuoo.portfolio.monitoring.service.ServiceMonitor;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.TriggerContext;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.URI;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

// 비웹 Context의 DB Runtime Monitoring 동적 반영 통합 검증
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class MonitoringRuntimeIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private ServiceMonitor serviceMonitor;

    @Autowired
    private MonitoringScheduler monitoringScheduler;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private HttpServer server;
    private ExecutorService serverExecutor;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM service_status");
        configureSettings(false, 60, 100, 300, 0, 0);
        jdbcTemplate.update("UPDATE monitoring_targets SET enabled = FALSE, health_url = NULL");
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
        if (serverExecutor != null) {
            serverExecutor.shutdownNow();
        }
        jdbcTemplate.update("DELETE FROM monitoring_targets WHERE service_key = 'TEST_RUNTIME_TARGET'");
        restoreRuntime();
        jdbcTemplate.update("DELETE FROM service_status");
    }

    // 설정 OFF와 동일 Context 설정 ON의 대상 조회·HTTP·상태 저장 반영 검증
    @Test
    void settingsOffSkipsCycleAndOnTakesEffectWithoutRestart() throws Exception {
        AtomicInteger hits = new AtomicInteger();
        URI uri = startServer(exchange -> {
            hits.incrementAndGet();
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
        });
        enableTarget("PORTFOLIO_FRONTEND", uri);

        serviceMonitor.checkAll();

        assertThat(hits).hasValue(0);
        assertThat(statusCount()).isZero();

        configureSettings(true, 60, 100, 300, 0, 0);
        serviceMonitor.checkAll();

        assertThat(hits).hasValue(1);
        assertThat(status("PORTFOLIO_FRONTEND")).isEqualTo("UP");
    }

    // 대상 활성값과 URL 변경의 다음 Cycle 반영 검증
    @Test
    void targetChangesTakeEffectWithoutRestart() throws Exception {
        AtomicInteger healthyHits = new AtomicInteger();
        AtomicInteger downHits = new AtomicInteger();
        AtomicInteger newTargetHits = new AtomicInteger();
        URI healthyUri = startServer(exchange -> {
            healthyHits.incrementAndGet();
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        URI downUri = URI.create(healthyUri.toString().replace("/health", "/down"));
        server.createContext("/down", exchange -> {
            downHits.incrementAndGet();
            exchange.sendResponseHeaders(503, -1);
            exchange.close();
        });
        URI newTargetUri = URI.create(healthyUri.toString().replace("/health", "/new"));
        server.createContext("/new", exchange -> {
            newTargetHits.incrementAndGet();
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        configureSettings(true, 60, 100, 300, 0, 0);
        enableTarget("PORTFOLIO_FRONTEND", healthyUri);

        serviceMonitor.checkAll();
        jdbcTemplate.update("UPDATE monitoring_targets SET enabled = FALSE WHERE service_key = 'PORTFOLIO_FRONTEND'");
        serviceMonitor.checkAll();
        jdbcTemplate.update("""
                UPDATE monitoring_targets
                SET enabled = TRUE, health_url = ?
                WHERE service_key = 'PORTFOLIO_FRONTEND'
                """, downUri.toString());
        jdbcTemplate.update("""
                INSERT INTO monitoring_targets (service_key, display_name, health_url, enabled, display_order)
                VALUES ('TEST_RUNTIME_TARGET', 'Runtime Target', ?, TRUE, 99)
                """, newTargetUri.toString());
        serviceMonitor.checkAll();

        assertThat(healthyHits).hasValue(1);
        assertThat(downHits).hasValue(1);
        assertThat(newTargetHits).hasValue(1);
        assertThat(status("PORTFOLIO_FRONTEND")).isEqualTo("DOWN");
        assertThat(status("TEST_RUNTIME_TARGET")).isEqualTo("UP");
    }

    // DB Request Timeout 변경의 다음 Cycle 적용 검증
    @Test
    void requestTimeoutChangesTakeEffectWithoutRestart() throws Exception {
        AtomicInteger hits = new AtomicInteger();
        URI uri = startServer(exchange -> {
            hits.incrementAndGet();
            try {
                Thread.sleep(120);
                exchange.sendResponseHeaders(200, -1);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            } finally {
                exchange.close();
            }
        });
        enableTarget("PORTFOLIO_FRONTEND", uri);
        configureSettings(true, 60, 100, 30, 0, 0);

        serviceMonitor.checkAll();
        configureSettings(true, 60, 100, 300, 0, 0);
        serviceMonitor.checkAll();

        assertThat(hits).hasValue(2);
        assertThat(status("PORTFOLIO_FRONTEND")).isEqualTo("UP");
    }

    // DB Max Retries 변경의 시도 횟수 반영 검증
    @Test
    void retryCountChangesTakeEffectWithoutRestart() throws Exception {
        AtomicInteger hits = new AtomicInteger();
        URI uri = startServer(exchange -> {
            hits.incrementAndGet();
            exchange.sendResponseHeaders(503, -1);
            exchange.close();
        });
        enableTarget("PORTFOLIO_FRONTEND", uri);
        configureSettings(true, 60, 100, 300, 0, 0);

        serviceMonitor.checkAll();
        configureSettings(true, 60, 100, 300, 0, 2);
        serviceMonitor.checkAll();

        assertThat(hits).hasValue(4);
        assertThat(status("PORTFOLIO_FRONTEND")).isEqualTo("DOWN");
    }

    // 잘못된 URL의 DOWN 격리와 다른 대상 실행 지속 검증
    @Test
    void invalidTargetUrlDoesNotStopOtherTargets() throws Exception {
        AtomicInteger hits = new AtomicInteger();
        URI uri = startServer(exchange -> {
            hits.incrementAndGet();
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        configureSettings(true, 60, 100, 300, 0, 0);
        jdbcTemplate.update("""
                UPDATE monitoring_targets
                SET enabled = TRUE, health_url = '://invalid'
                WHERE service_key = 'PORTFOLIO_FRONTEND'
                """);
        enableTarget("PORTFOLIO_BACKEND", uri);

        serviceMonitor.checkAll();

        assertThat(hits).hasValue(1);
        assertThat(status("PORTFOLIO_FRONTEND")).isEqualTo("DOWN");
        assertThat(status("PORTFOLIO_BACKEND")).isEqualTo("UP");
    }

    // DB Interval 기반 완료 시점 다음 실행시각 계산 검증
    @Test
    void intervalChangesAdjustNextExecutionDeterministically() {
        Instant completedAt = Instant.parse("2026-09-19T00:00:00Z");
        configureSettings(true, 60, 100, 300, 0, 0);

        assertThat(monitoringScheduler.nextExecution(triggerContext(completedAt)))
                .isEqualTo(completedAt.plusSeconds(60));

        configureSettings(true, 120, 100, 300, 0, 0);

        assertThat(monitoringScheduler.nextExecution(triggerContext(completedAt)))
                .isEqualTo(completedAt.plusSeconds(120));
    }

    // 설정 Row 누락 시 Fallback Scheduling과 Cycle 생존 검증
    @Test
    void missingSettingsUsesFallbackAndSkipsChecks() throws Exception {
        AtomicInteger hits = new AtomicInteger();
        URI uri = startServer(exchange -> {
            hits.incrementAndGet();
            exchange.sendResponseHeaders(200, -1);
            exchange.close();
        });
        enableTarget("PORTFOLIO_FRONTEND", uri);
        Instant completedAt = Instant.parse("2026-09-19T00:00:00Z");
        jdbcTemplate.update("DELETE FROM monitoring_settings");

        assertThat(monitoringScheduler.nextExecution(triggerContext(completedAt)))
                .isEqualTo(completedAt.plusSeconds(300));
        serviceMonitor.checkAll();

        assertThat(hits).hasValue(0);
        assertThat(statusCount()).isZero();
    }

    private URI startServer(com.sun.net.httpserver.HttpHandler handler) throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        serverExecutor = Executors.newCachedThreadPool();
        server.setExecutor(serverExecutor);
        server.createContext("/health", handler);
        server.start();
        return URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/health");
    }

    private void configureSettings(
            boolean enabled,
            int intervalSeconds,
            int connectTimeoutMs,
            int requestTimeoutMs,
            int retryDelayMs,
            int maxRetries
    ) {
        jdbcTemplate.update("""
                UPDATE monitoring_settings
                SET enabled = ?, check_interval_seconds = ?, connect_timeout_ms = ?,
                    request_timeout_ms = ?, retry_delay_ms = ?, max_retries = ?
                WHERE id = 1
                """, enabled, intervalSeconds, connectTimeoutMs, requestTimeoutMs, retryDelayMs, maxRetries);
    }

    private void enableTarget(String serviceKey, URI uri) {
        jdbcTemplate.update("""
                UPDATE monitoring_targets
                SET enabled = TRUE, health_url = ?
                WHERE service_key = ?
                """, uri.toString(), serviceKey);
    }

    private String status(String serviceKey) {
        return jdbcTemplate.queryForObject(
                "SELECT status FROM service_status WHERE service_key = ?", String.class, serviceKey);
    }

    private int statusCount() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM service_status", Integer.class);
    }

    private TriggerContext triggerContext(Instant completedAt) {
        return new TriggerContext() {
            @Override
            public Clock getClock() {
                return Clock.fixed(completedAt, ZoneOffset.UTC);
            }

            @Override
            public Instant lastScheduledExecution() {
                return completedAt;
            }

            @Override
            public Instant lastActualExecution() {
                return completedAt;
            }

            @Override
            public Instant lastCompletion() {
                return completedAt;
            }
        };
    }

    private void restoreRuntime() {
        jdbcTemplate.update("""
                INSERT INTO monitoring_settings (
                    id, enabled, check_interval_seconds, connect_timeout_ms,
                    request_timeout_ms, retry_delay_ms, max_retries
                ) VALUES (1, TRUE, 300, 2000, 3000, 500, 1)
                ON CONFLICT (id) DO UPDATE
                SET enabled = EXCLUDED.enabled,
                    check_interval_seconds = EXCLUDED.check_interval_seconds,
                    connect_timeout_ms = EXCLUDED.connect_timeout_ms,
                    request_timeout_ms = EXCLUDED.request_timeout_ms,
                    retry_delay_ms = EXCLUDED.retry_delay_ms,
                    max_retries = EXCLUDED.max_retries
                """);
        jdbcTemplate.update("""
                UPDATE monitoring_targets
                SET health_url = CASE service_key
                        WHEN 'PORTFOLIO_FRONTEND' THEN 'http://frontend:3000/healthz'
                        WHEN 'PORTFOLIO_BACKEND' THEN 'http://backend:8080/actuator/health'
                        ELSE NULL
                    END,
                    enabled = service_key IN ('PORTFOLIO_FRONTEND', 'PORTFOLIO_BACKEND'),
                    display_order = CASE service_key
                        WHEN 'PORTFOLIO_FRONTEND' THEN 1
                        WHEN 'PORTFOLIO_BACKEND' THEN 2
                        WHEN 'KYVC_FRONTEND' THEN 3
                        WHEN 'KYVC_BACKEND' THEN 4
                        WHEN 'KYVC_CORE' THEN 5
                        WHEN 'SHKUTRACK' THEN 6
                    END
                WHERE service_key IN (
                    'PORTFOLIO_FRONTEND', 'PORTFOLIO_BACKEND', 'KYVC_FRONTEND',
                    'KYVC_BACKEND', 'KYVC_CORE', 'SHKUTRACK'
                )
                """);
    }
}
