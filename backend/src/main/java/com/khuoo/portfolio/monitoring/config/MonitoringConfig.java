package com.khuoo.portfolio.monitoring.config;

import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.validation.WebUrlValidator;
import com.khuoo.portfolio.monitoring.repository.ServiceStatusRepository;
import com.khuoo.portfolio.monitoring.scheduler.MonitoringScheduler;
import com.khuoo.portfolio.monitoring.service.HealthCheckClient;
import com.khuoo.portfolio.monitoring.service.ServiceMonitor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnNotWebApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.net.URI;
import java.net.http.HttpClient;
import java.time.Clock;
import java.time.Duration;
import java.util.List;

// 비웹 Monitor Context 전용 HTTP 검사 및 Scheduling 구성
@Configuration(proxyBeanMethods = false)
@EnableScheduling
@EnableConfigurationProperties(MonitoringProperties.class)
@ConditionalOnNotWebApplication
@ConditionalOnProperty(name = "portfolio.monitoring.enabled", havingValue = "true")
public class MonitoringConfig {

    // 설정된 Connect Timeout 기반 JDK HTTP Client 제공
    @Bean
    HttpClient monitoringHttpClient(MonitoringProperties properties) {
        requirePositive(properties.connectTimeout(), "connect-timeout");
        return HttpClient.newBuilder()
                .connectTimeout(properties.connectTimeout())
                .build();
    }

    // 여섯 고정 대상 URL 검증 및 검사 대상 구성
    @Bean
    List<MonitorTarget> monitorTargets(MonitoringProperties properties, WebUrlValidator webUrlValidator) {
        requirePositive(properties.requestTimeout(), "request-timeout");
        requireNonNegative(properties.retryDelay(), "retry-delay");
        MonitoringProperties.Targets targets = properties.targets();
        return List.of(
                target(PortfolioConstants.ServiceKey.PORTFOLIO_FRONTEND, targets.portfolioFrontend(), webUrlValidator),
                target(PortfolioConstants.ServiceKey.PORTFOLIO_BACKEND, targets.portfolioBackend(), webUrlValidator),
                target(PortfolioConstants.ServiceKey.KYVC_FRONTEND, targets.kyvcFrontend(), webUrlValidator),
                target(PortfolioConstants.ServiceKey.KYVC_BACKEND, targets.kyvcBackend(), webUrlValidator),
                target(PortfolioConstants.ServiceKey.KYVC_CORE, targets.kyvcCore(), webUrlValidator),
                target(PortfolioConstants.ServiceKey.SHKUTRACK, targets.shkutrack(), webUrlValidator)
        );
    }

    // Retry 정책을 포함한 Health HTTP 검사기 제공
    @Bean
    HealthCheckClient healthCheckClient(HttpClient monitoringHttpClient, MonitoringProperties properties) {
        return new HealthCheckClient(
                monitoringHttpClient,
                properties.requestTimeout(),
                properties.retryDelay()
        );
    }

    // 서비스별 현재 상태 갱신 흐름 제공
    @Bean
    ServiceMonitor serviceMonitor(
            List<MonitorTarget> monitorTargets,
            HealthCheckClient healthCheckClient,
            ServiceStatusRepository serviceStatusRepository,
            LogEventLogger logEventLogger,
            Clock clock
    ) {
        return new ServiceMonitor(
                monitorTargets,
                healthCheckClient,
                serviceStatusRepository,
                logEventLogger,
                clock
        );
    }

    // 5분 고정 주기의 Monitor Scheduler 제공
    @Bean
    MonitoringScheduler monitoringScheduler(ServiceMonitor serviceMonitor) {
        return new MonitoringScheduler(serviceMonitor);
    }

    private MonitorTarget target(String serviceKey, String value, WebUrlValidator webUrlValidator) {
        webUrlValidator.validate(value);
        return new MonitorTarget(serviceKey, URI.create(value));
    }

    private void requirePositive(Duration value, String name) {
        if (value.isZero() || value.isNegative()) {
            throw new IllegalStateException("portfolio.monitoring." + name + " must be positive");
        }
    }

    private void requireNonNegative(Duration value, String name) {
        if (value.isNegative()) {
            throw new IllegalStateException("portfolio.monitoring." + name + " must not be negative");
        }
    }
}
