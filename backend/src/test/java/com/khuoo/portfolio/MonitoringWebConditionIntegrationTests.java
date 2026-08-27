package com.khuoo.portfolio;

import com.khuoo.portfolio.monitoring.scheduler.MonitoringScheduler;
import com.khuoo.portfolio.monitoring.service.HealthCheckClient;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.WebApplicationContext;

import static org.assertj.core.api.Assertions.assertThat;

// Monitoring 활성 설정에서도 Backend Web Context의 Scheduler 비활성 검증
@SpringBootTest(properties = {
        "portfolio.monitoring.enabled=true",
        "portfolio.monitoring.targets.portfolio-frontend=http://127.0.0.1:1/frontend",
        "portfolio.monitoring.targets.portfolio-backend=http://127.0.0.1:1/backend",
        "portfolio.monitoring.targets.kyvc-frontend=http://127.0.0.1:1/kyvc-frontend",
        "portfolio.monitoring.targets.kyvc-backend=http://127.0.0.1:1/kyvc-backend",
        "portfolio.monitoring.targets.kyvc-core=http://127.0.0.1:1/kyvc-core",
        "portfolio.monitoring.targets.shkutrack=http://127.0.0.1:1/shkutrack"
})
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
