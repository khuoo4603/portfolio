package com.khuoo.portfolio.common.startup;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.lang.management.ManagementFactory;
import java.time.Duration;
import java.util.Arrays;
import java.util.Locale;
import java.util.TimeZone;

// 애플리케이션 시작 상태 및 실행 환경 로그 출력
@Component
@RequiredArgsConstructor
public class StartupLoggerRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupLoggerRunner.class);
    private static final Logger startupConsoleLog = LoggerFactory.getLogger("PORTFOLIO_STARTUP_CONSOLE");
    private static final long BYTES_PER_MEGABYTE = 1024L * 1024L;

    private final Environment environment;
    private final ObjectProvider<JdbcTemplate> jdbcTemplateProvider;

    // 애플리케이션 시작 정보 및 DB 연결 상태 기록
    @Override
    public void run(ApplicationArguments args) {
        DbHealth dbHealth = checkDbHealth();
        String profiles = Arrays.toString(resolveActiveProfiles());

        log.info(
                "service=backend env={} event=application.started app={} activeProfiles={} serverPort={} dbStatus={} message=\"애플리케이션 시작 완료\"",
                resolveEnvironment(),
                environment.getProperty("spring.application.name", "portfolio-backend"),
                profiles,
                resolveServerPort(),
                dbHealth.status()
        );
        logConsoleStartupDetails(dbHealth, profiles);

        if (!dbHealth.up()) {
            log.error(
                    "service=backend env={} event=application.db.down dbStatus={} failureReason={} message=\"데이터베이스 연결 확인 실패\"",
                    resolveEnvironment(),
                    dbHealth.status(),
                    dbHealth.failureReason()
            );
        }
    }

    // 콘솔 전용 시작 상세 정보 출력
    private void logConsoleStartupDetails(DbHealth dbHealth, String profiles) {
        startupConsoleLog.info("==================================================");
        startupConsoleLog.info("[Portfolio Backend Started]");
        startupConsoleLog.info("애플리케이션 이름: {}", environment.getProperty("spring.application.name", "portfolio-backend"));
        startupConsoleLog.info("실행 프로필: {}", profiles);
        startupConsoleLog.info("서버 포트: {}", resolveServerPort());
        startupConsoleLog.info("Context Path: {}", environment.getProperty("server.servlet.context-path", "/"));
        startupConsoleLog.info("로그 경로: {}", environment.getProperty("logging.file.path", "build/logs"));
        startupConsoleLog.info("프로세스 ID: {}", ProcessHandle.current().pid());
        startupConsoleLog.info("JVM Uptime: {}", formatDuration(ManagementFactory.getRuntimeMXBean().getUptime()));
        startupConsoleLog.info("Java 버전: {}", System.getProperty("java.version"));
        startupConsoleLog.info("운영체제: {} {}", System.getProperty("os.name"), System.getProperty("os.version"));
        startupConsoleLog.info("OS 아키텍처: {}", System.getProperty("os.arch"));
        startupConsoleLog.info("TimeZone: {}", TimeZone.getDefault().getID());
        startupConsoleLog.info("Locale: {}", Locale.getDefault().toLanguageTag());
        startupConsoleLog.info("Max Heap Memory: {} MB", Runtime.getRuntime().maxMemory() / BYTES_PER_MEGABYTE);
        startupConsoleLog.info("CPU Core Count: {}", Runtime.getRuntime().availableProcessors());
        startupConsoleLog.info("DB 연결 상태: {}", dbHealth.status());
        startupConsoleLog.info("==================================================");
    }

    // 실제 JDBC 연결 상태 확인
    private DbHealth checkDbHealth() {
        JdbcTemplate jdbcTemplate = jdbcTemplateProvider.getIfAvailable();
        if (jdbcTemplate == null) {
            return new DbHealth("실패", false, "JdbcTemplate 없음");
        }

        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
            return new DbHealth("정상", true, null);
        } catch (Exception exception) {
            return new DbHealth("실패", false, exception.getClass().getSimpleName());
        }
    }

    // 활성 프로필 문자열 배열 조회
    private String[] resolveActiveProfiles() {
        String[] activeProfiles = environment.getActiveProfiles();
        return activeProfiles.length == 0 ? new String[]{"default"} : activeProfiles;
    }

    // 실행 환경명 조회
    private String resolveEnvironment() {
        return String.join(",", resolveActiveProfiles());
    }

    // 실제 서버 포트 조회
    private String resolveServerPort() {
        return environment.getProperty(
                "local.server.port",
                environment.getProperty("server.port", "8080")
        );
    }

    // JVM 실행 시간 문자열 변환
    private String formatDuration(long uptimeMs) {
        Duration duration = Duration.ofMillis(uptimeMs);
        return "%d초".formatted(duration.toSeconds());
    }

    private record DbHealth(
            String status,
            boolean up,
            String failureReason
    ) {
    }
}
