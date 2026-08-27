package com.khuoo.portfolio.monitoring.config;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.validation.WebUrlValidator;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.scheduling.annotation.Scheduled;

import java.net.http.HttpClient;
import java.lang.reflect.Method;
import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Monitoring 설정 기본값·Override·URL·고정 정책 검증
class MonitoringConfigTests {

    // 변경 가능한 HTTP 기본값과 고정 주기·Retry 정책 검증
    @Test
    void defaultsAndFixedPoliciesAreSeparated() {
        MonitoringProperties properties = new MonitoringProperties(false, null, null, null, null);

        assertThat(properties.connectTimeout()).isEqualTo(Duration.ofSeconds(2));
        assertThat(properties.requestTimeout()).isEqualTo(Duration.ofSeconds(3));
        assertThat(properties.retryDelay()).isEqualTo(Duration.ofMillis(500));
        assertThat(PortfolioConstants.Monitoring.CHECK_INTERVAL_MS).isEqualTo(300_000L);
        assertThat(PortfolioConstants.Monitoring.MAX_RETRIES).isOne();
        Method scheduledMethod = java.util.Arrays.stream(
                        com.khuoo.portfolio.monitoring.scheduler.MonitoringScheduler.class.getDeclaredMethods())
                .filter(method -> method.getName().equals("checkServices"))
                .findFirst()
                .orElseThrow();
        assertThat(scheduledMethod.getAnnotation(Scheduled.class).fixedDelay())
                .isEqualTo(PortfolioConstants.Monitoring.CHECK_INTERVAL_MS);
    }

    // 설정 Override와 여섯 Service Key 순서 및 JDK Client 적용 검증
    @Test
    void overridesApplyToJdkClientAndTargets() {
        MonitoringProperties properties = properties(
                Duration.ofMillis(250),
                Duration.ofMillis(350),
                Duration.ofMillis(25),
                "https://portfolio.example/health?ready=true#probe"
        );
        MonitoringConfig config = new MonitoringConfig();

        HttpClient client = config.monitoringHttpClient(properties);
        List<MonitorTarget> targets = config.monitorTargets(properties, new WebUrlValidator());

        assertThat(client.connectTimeout()).contains(Duration.ofMillis(250));
        assertThat(properties.requestTimeout()).isEqualTo(Duration.ofMillis(350));
        assertThat(properties.retryDelay()).isEqualTo(Duration.ofMillis(25));
        assertThat(targets).extracting(MonitorTarget::serviceKey)
                .containsExactlyElementsOf(PortfolioConstants.ServiceKey.ORDERED);
        assertThat(targets.getFirst().uri().getQuery()).isEqualTo("ready=true");
        assertThat(targets.getFirst().uri().getFragment()).isEqualTo("probe");
    }

    // 누락·상대·비HTTP URL의 Monitor 시작 구성 실패 검증
    @Test
    void missingOrInvalidTargetFailsConfiguration() {
        MonitoringConfig config = new MonitoringConfig();
        assertThatThrownBy(() -> config.monitorTargets(
                properties(Duration.ofSeconds(2), Duration.ofSeconds(3), Duration.ZERO, ""),
                new WebUrlValidator()
        )).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> config.monitorTargets(
                properties(Duration.ofSeconds(2), Duration.ofSeconds(3), Duration.ZERO, "/health"),
                new WebUrlValidator()
        )).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> config.monitorTargets(
                properties(Duration.ofSeconds(2), Duration.ofSeconds(3), Duration.ZERO, "ftp://example.com/health"),
                new WebUrlValidator()
        )).isInstanceOf(ApiException.class);
    }

    // 활성 비웹 Context의 URL 누락 시 실제 Context 시작 실패 검증
    @Test
    void enabledNonWebContextFailsWhenUrlsAreMissing() {
        new ApplicationContextRunner()
                .withUserConfiguration(MonitoringConfig.class, WebUrlValidator.class)
                .withPropertyValues("portfolio.monitoring.enabled=true")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure()).hasRootCauseInstanceOf(ApiException.class);
                });
    }

    private MonitoringProperties properties(
            Duration connectTimeout,
            Duration requestTimeout,
            Duration retryDelay,
            String firstUrl
    ) {
        return new MonitoringProperties(
                true,
                connectTimeout,
                requestTimeout,
                retryDelay,
                new MonitoringProperties.Targets(
                        firstUrl,
                        "http://portfolio-backend.example/health",
                        "https://kyvc-frontend.example/health",
                        "https://kyvc-backend.example/health",
                        "https://kyvc-core.example/health",
                        "https://shkutrack.example/health"
                )
        );
    }
}
