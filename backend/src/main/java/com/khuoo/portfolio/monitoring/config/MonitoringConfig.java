package com.khuoo.portfolio.monitoring.config;

import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.monitoring.repository.MonitoringSettingsQueryRepository;
import com.khuoo.portfolio.monitoring.repository.MonitoringTargetQueryRepository;
import com.khuoo.portfolio.monitoring.repository.ServiceStatusRepository;
import com.khuoo.portfolio.monitoring.scheduler.MonitoringScheduler;
import com.khuoo.portfolio.monitoring.service.HealthCheckClient;
import com.khuoo.portfolio.monitoring.service.ServiceMonitor;
import org.springframework.boot.autoconfigure.condition.ConditionalOnNotWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import java.time.Clock;

// 비웹 Monitor Context 전용 DB Runtime 검사 및 Scheduling 구성
@Configuration(proxyBeanMethods = false)
@ConditionalOnNotWebApplication
public class MonitoringConfig {

    // 단일 실행 흐름 보장용 Monitor 전용 Scheduler 제공
    @Bean
    ThreadPoolTaskScheduler monitoringTaskScheduler() {
        ThreadPoolTaskScheduler scheduler = new ThreadPoolTaskScheduler();
        scheduler.setPoolSize(1);
        scheduler.setThreadNamePrefix("monitoring-");
        return scheduler;
    }

    // DB Snapshot 기반 Health HTTP 검사기 제공
    @Bean
    HealthCheckClient healthCheckClient() {
        return new HealthCheckClient();
    }

    // DB 설정과 대상 기반 서비스별 현재 상태 갱신 흐름 제공
    @Bean
    ServiceMonitor serviceMonitor(
            MonitoringSettingsQueryRepository monitoringSettingsQueryRepository,
            MonitoringTargetQueryRepository monitoringTargetQueryRepository,
            HealthCheckClient healthCheckClient,
            ServiceStatusRepository serviceStatusRepository,
            LogEventLogger logEventLogger,
            Clock clock
    ) {
        return new ServiceMonitor(
                monitoringSettingsQueryRepository,
                monitoringTargetQueryRepository,
                healthCheckClient,
                serviceStatusRepository,
                logEventLogger,
                clock
        );
    }

    // DB 주기 Trigger 기반 Monitor Scheduler 제공
    @Bean
    MonitoringScheduler monitoringScheduler(
            ServiceMonitor serviceMonitor,
            MonitoringSettingsQueryRepository monitoringSettingsQueryRepository,
            LogEventLogger logEventLogger,
            ThreadPoolTaskScheduler monitoringTaskScheduler
    ) {
        return new MonitoringScheduler(
                serviceMonitor,
                monitoringSettingsQueryRepository,
                logEventLogger,
                monitoringTaskScheduler
        );
    }
}
