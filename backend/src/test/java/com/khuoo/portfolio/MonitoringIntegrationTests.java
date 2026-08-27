package com.khuoo.portfolio;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.Level;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.util.PortfolioEnums.ServiceStatus;
import com.khuoo.portfolio.monitoring.config.MonitorTarget;
import com.khuoo.portfolio.monitoring.repository.ServiceStatusRepository;
import com.khuoo.portfolio.monitoring.service.HealthCheckClient;
import com.khuoo.portfolio.monitoring.service.ServiceMonitor;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import java.io.IOException;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.URI;
import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

import static org.assertj.core.api.Assertions.assertThat;

// 실제 HTTP와 PostgreSQL 기반 Monitor 상태·Retry·전환 통합 검증
@SpringBootTest
class MonitoringIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private ServiceStatusRepository serviceStatusRepository;

    @Autowired
    private LogEventLogger logEventLogger;

    @Autowired
    private Clock clock;

    @Autowired
    private JdbcTemplate jdbcTemplate;

    private HttpServer server;
    private ExecutorService serverExecutor;
    private Logger eventLogger;
    private ListAppender<ILoggingEvent> appender;

    @BeforeEach
    void setUp() {
        jdbcTemplate.update("DELETE FROM service_status");
        eventLogger = (Logger) LoggerFactory.getLogger(LogEventLogger.class);
        appender = new ListAppender<>();
        appender.start();
        eventLogger.addAppender(appender);
    }

    @AfterEach
    void tearDown() {
        if (server != null) {
            server.stop(0);
        }
        if (serverExecutor != null) {
            serverExecutor.shutdownNow();
        }
        eventLogger.detachAppender(appender);
        appender.stop();
        jdbcTemplate.update("DELETE FROM service_status");
    }

    // 최초 성공 Row 생성과 동일 상태 단일 Row 갱신 및 변화 로그 미기록 검증
    @Test
    void successfulChecksUpsertOneRowWithoutTransitionLog() throws Exception {
        AtomicInteger hits = new AtomicInteger();
        URI uri = startServer(exchange -> {
            hits.incrementAndGet();
            exchange.sendResponseHeaders(204, -1);
            exchange.close();
        });
        uri = URI.create(uri + "?ready=true#probe");
        ServiceMonitor monitor = monitor(uri, Duration.ofSeconds(1), Duration.ZERO);

        HealthCheckClient.HealthCheckResult first = monitor.check(target(uri));
        HealthCheckClient.HealthCheckResult second = monitor.check(target(uri));

        assertThat(first.status()).isEqualTo(ServiceStatus.UP);
        assertThat(first.httpStatus()).isEqualTo(204);
        assertThat(first.responseTimeMs()).isNotNull().isGreaterThanOrEqualTo(0);
        assertThat(second.status()).isEqualTo(ServiceStatus.UP);
        assertThat(hits).hasValue(2);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM service_status WHERE service_key = 'PORTFOLIO_BACKEND'", Integer.class))
                .isOne();
        assertThat(jdbcTemplate.queryForMap("""
                SELECT status, http_status
                FROM service_status
                WHERE service_key = 'PORTFOLIO_BACKEND'
                """))
                .containsEntry("status", "UP")
                .containsEntry("http_status", 204);
        assertThat(transitionMessages()).isEmpty();
    }

    // 최초 실패 후 한 번만 재시도하여 성공 상태로 저장하는지 검증
    @Test
    void firstFailureRetriesOnceAndCanRecover() throws Exception {
        AtomicInteger hits = new AtomicInteger();
        URI uri = startServer(exchange -> {
            int status = hits.incrementAndGet() == 1 ? 503 : 200;
            exchange.sendResponseHeaders(status, -1);
            exchange.close();
        });

        HealthCheckClient.HealthCheckResult result = monitor(uri, Duration.ofSeconds(1), Duration.ZERO)
                .check(target(uri));

        assertThat(result.status()).isEqualTo(ServiceStatus.UP);
        assertThat(result.httpStatus()).isEqualTo(200);
        assertThat(hits).hasValue(2);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT status FROM service_status WHERE service_key = 'PORTFOLIO_BACKEND'", String.class))
                .isEqualTo("UP");
    }

    // 두 번 모두 2xx 외 Status일 때 DOWN과 최종 HTTP 측정값 저장 검증
    @Test
    void twoFailedStatusesBecomeDownAfterOneRetry() throws Exception {
        AtomicInteger hits = new AtomicInteger();
        URI uri = startServer(exchange -> {
            hits.incrementAndGet();
            exchange.getResponseHeaders().add("Location", "/health");
            exchange.sendResponseHeaders(302, -1);
            exchange.close();
        });

        HealthCheckClient.HealthCheckResult result = monitor(uri, Duration.ofSeconds(1), Duration.ZERO)
                .check(target(uri));

        assertThat(result.status()).isEqualTo(ServiceStatus.DOWN);
        assertThat(result.httpStatus()).isEqualTo(302);
        assertThat(result.responseTimeMs()).isNotNull();
        assertThat(hits).hasValue(2);
        assertThat(jdbcTemplate.queryForObject(
                "SELECT status FROM service_status WHERE service_key = 'PORTFOLIO_BACKEND'", String.class))
                .isEqualTo("DOWN");
        assertThat(transitionMessages()).isEmpty();
    }

    // Timeout과 연결 실패의 DOWN 및 측정 불가 값 null 저장 검증
    @Test
    void timeoutAndConnectionFailureStoreNullableMeasurements() throws Exception {
        AtomicInteger timeoutHits = new AtomicInteger();
        URI timeoutUri = startServer(exchange -> {
            timeoutHits.incrementAndGet();
            try {
                Thread.sleep(200);
                exchange.sendResponseHeaders(200, -1);
            } catch (InterruptedException exception) {
                Thread.currentThread().interrupt();
            } finally {
                exchange.close();
            }
        });
        HealthCheckClient.HealthCheckResult timeout = monitor(
                timeoutUri,
                Duration.ofMillis(30),
                Duration.ZERO
        ).check(target(timeoutUri));

        assertThat(timeout.status()).isEqualTo(ServiceStatus.DOWN);
        assertThat(timeout.httpStatus()).isNull();
        assertThat(timeout.responseTimeMs()).isNull();
        assertThat(timeoutHits).hasValue(2);

        server.stop(0);
        serverExecutor.shutdownNow();
        server = null;
        serverExecutor = null;
        int closedPort;
        try (ServerSocket socket = new ServerSocket(0)) {
            closedPort = socket.getLocalPort();
        }
        URI connectionUri = URI.create("http://127.0.0.1:" + closedPort + "/health");
        HealthCheckClient.HealthCheckResult connection = monitor(
                connectionUri,
                Duration.ofMillis(100),
                Duration.ZERO
        ).check(target(connectionUri));

        assertThat(connection.status()).isEqualTo(ServiceStatus.DOWN);
        assertThat(connection.httpStatus()).isNull();
        assertThat(connection.responseTimeMs()).isNull();
    }

    // UP·DOWN 실제 상태 전환만 WARN·INFO로 기록하는지 검증
    @Test
    void onlyRealStatusTransitionsProduceLogs() throws Exception {
        AtomicInteger status = new AtomicInteger(200);
        URI uri = startServer(exchange -> {
            exchange.sendResponseHeaders(status.get(), -1);
            exchange.close();
        });
        ServiceMonitor monitor = monitor(uri, Duration.ofSeconds(1), Duration.ZERO);

        monitor.check(target(uri));
        assertThat(transitionMessages()).isEmpty();

        status.set(503);
        monitor.check(target(uri));
        assertThat(transitionMessages())
                .singleElement()
                .satisfies(message -> assertThat(message)
                        .contains("event=monitoring.service.down")
                        .contains("previousStatus=UP")
                        .contains("status=DOWN"));
        assertThat(transitionEvents()).singleElement()
                .satisfies(event -> assertThat(event.getLevel()).isEqualTo(Level.WARN));

        monitor.check(target(uri));
        assertThat(transitionMessages()).hasSize(1);

        status.set(200);
        monitor.check(target(uri));
        assertThat(transitionMessages())
                .hasSize(2)
                .last()
                .satisfies(message -> assertThat(message)
                        .contains("event=monitoring.service.recovered")
                        .contains("previousStatus=DOWN")
                        .contains("status=UP"));
        assertThat(transitionEvents().getLast().getLevel()).isEqualTo(Level.INFO);
    }

    private ServiceMonitor monitor(URI uri, Duration requestTimeout, Duration retryDelay) {
        HttpClient httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofMillis(100))
                .build();
        return new ServiceMonitor(
                List.of(target(uri)),
                new HealthCheckClient(httpClient, requestTimeout, retryDelay),
                serviceStatusRepository,
                logEventLogger,
                clock
        );
    }

    private MonitorTarget target(URI uri) {
        return new MonitorTarget("PORTFOLIO_BACKEND", uri);
    }

    private URI startServer(com.sun.net.httpserver.HttpHandler handler) throws IOException {
        server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        serverExecutor = Executors.newCachedThreadPool();
        server.setExecutor(serverExecutor);
        server.createContext("/health", handler);
        server.start();
        return URI.create("http://127.0.0.1:" + server.getAddress().getPort() + "/health");
    }

    private List<String> transitionMessages() {
        return transitionEvents().stream()
                .map(ILoggingEvent::getFormattedMessage)
                .toList();
    }

    private List<ILoggingEvent> transitionEvents() {
        return appender.list.stream()
                .filter(event -> event.getFormattedMessage().contains("event=monitoring.service."))
                .toList();
    }
}
