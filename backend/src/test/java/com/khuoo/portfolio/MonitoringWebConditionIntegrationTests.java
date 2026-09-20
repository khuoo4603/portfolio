package com.khuoo.portfolio;

import com.khuoo.portfolio.monitoring.scheduler.MonitoringScheduler;
import com.khuoo.portfolio.monitoring.service.HealthCheckClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

// Backend Web Context의 Monitor Scheduler 비활성 검증
@SpringBootTest
class MonitoringWebConditionIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    // Web ON에서 Monitor HTTP Client와 Scheduler 미생성 검증
    @Test
    void webContextKeepsMonitoringSchedulerOff() {
        assertThat(applicationContext).isInstanceOf(WebApplicationContext.class);
        assertThat(applicationContext.getBeansOfType(MonitoringScheduler.class)).isEmpty();
        assertThat(applicationContext.getBeansOfType(HealthCheckClient.class)).isEmpty();
    }
}
