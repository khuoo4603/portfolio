package com.khuoo.portfolio;

import com.khuoo.portfolio.monitoring.scheduler.MonitoringScheduler;
import com.khuoo.portfolio.monitoring.service.HealthCheckClient;
import com.khuoo.portfolio.monitoring.service.ServiceMonitor;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

// 비웹 Monitor Context의 DB Runtime Bean 통합 검증
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
class MonitorContextIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private MonitoringScheduler monitoringScheduler;

    @Autowired
    private ServiceMonitor serviceMonitor;

    @Autowired
    private HealthCheckClient healthCheckClient;

    // DB 설정 ON·OFF와 관계없는 비웹 Runtime Bean 생성 검증
    @Test
    void monitorContextEnablesOnlyNonWebScheduler() {
        assertThat(applicationContext).isNotInstanceOf(WebApplicationContext.class);
        assertThat(monitoringScheduler).isNotNull();
        assertThat(serviceMonitor).isNotNull();
        assertThat(healthCheckClient).isNotNull();
    }
}
