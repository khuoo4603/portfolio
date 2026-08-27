package com.khuoo.portfolio;

import com.khuoo.portfolio.monitoring.config.MonitorTarget;
import com.khuoo.portfolio.monitoring.config.MonitoringProperties;
import com.khuoo.portfolio.monitoring.scheduler.MonitoringScheduler;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.ApplicationContext;
import org.springframework.web.context.WebApplicationContext;

import java.time.Duration;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

// 비웹 Monitor Context의 조건부 Bean과 설정 Binding 통합 검증
@SpringBootTest(
        webEnvironment = SpringBootTest.WebEnvironment.NONE,
        properties = {
                "portfolio.monitoring.enabled=true",
                "portfolio.monitoring.connect-timeout=40ms",
                "portfolio.monitoring.request-timeout=60ms",
                "portfolio.monitoring.retry-delay=0ms",
                "portfolio.monitoring.targets.portfolio-frontend=http://127.0.0.1:1/frontend",
                "portfolio.monitoring.targets.portfolio-backend=http://127.0.0.1:1/backend",
                "portfolio.monitoring.targets.kyvc-frontend=http://127.0.0.1:1/kyvc-frontend",
                "portfolio.monitoring.targets.kyvc-backend=http://127.0.0.1:1/kyvc-backend",
                "portfolio.monitoring.targets.kyvc-core=http://127.0.0.1:1/kyvc-core",
                "portfolio.monitoring.targets.shkutrack=http://127.0.0.1:1/shkutrack"
        }
)
class MonitorContextIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private ApplicationContext applicationContext;

    @Autowired
    private MonitoringScheduler monitoringScheduler;

    @Autowired
    private MonitoringProperties monitoringProperties;

    @Autowired
    private List<MonitorTarget> monitorTargets;

    // Web OFF·Scheduler ON·여섯 대상·설정 Override 검증
    @Test
    void monitorContextEnablesOnlyNonWebScheduler() {
        assertThat(applicationContext).isNotInstanceOf(WebApplicationContext.class);
        assertThat(monitoringScheduler).isNotNull();
        assertThat(monitorTargets).hasSize(6);
        assertThat(monitoringProperties.enabled()).isTrue();
        assertThat(monitoringProperties.connectTimeout()).isEqualTo(Duration.ofMillis(40));
        assertThat(monitoringProperties.requestTimeout()).isEqualTo(Duration.ofMillis(60));
        assertThat(monitoringProperties.retryDelay()).isZero();
    }
}
