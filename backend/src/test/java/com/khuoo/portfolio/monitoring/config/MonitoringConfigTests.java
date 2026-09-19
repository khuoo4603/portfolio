package com.khuoo.portfolio.monitoring.config;

import com.khuoo.portfolio.monitoring.service.HealthCheckClient;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.condition.ConditionalOnNotWebApplication;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// Monitoring DB Runtime 구성과 정적 환경 설정 제거 검증
class MonitoringConfigTests {

    // 비웹 조건 유지와 환경 Property 조건 제거 검증
    @Test
    void keepsOnlyNonWebCondition() {
        assertThat(MonitoringConfig.class.getAnnotation(ConditionalOnNotWebApplication.class)).isNotNull();
        assertThat(MonitoringConfig.class.getAnnotation(ConditionalOnProperty.class)).isNull();
    }

    // 단일 실행 흐름용 Scheduler와 무상태 Health Client 제공 검증
    @Test
    void providesSingleThreadSchedulerAndStatelessClient() {
        MonitoringConfig config = new MonitoringConfig();
        ThreadPoolTaskScheduler scheduler = config.monitoringTaskScheduler();

        assertThat(scheduler.getPoolSize()).isOne();
        assertThat(config.healthCheckClient()).isInstanceOf(HealthCheckClient.class);
    }

    // 제거된 환경 설정 Binding Class 부재 검증
    @Test
    void removesEnvironmentBoundMonitoringProperties() {
        assertThatThrownBy(() -> Class.forName(
                "com.khuoo.portfolio.monitoring.config.MonitoringProperties"))
                .isInstanceOf(ClassNotFoundException.class);
    }
}
