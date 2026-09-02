package com.khuoo.portfolio.monitoring.scheduler;

import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.monitoring.service.ServiceMonitor;
import org.springframework.scheduling.annotation.Scheduled;

// 비웹 Monitor Context의 5분 고정 상태 확인 Scheduler
public class MonitoringScheduler {

    private final ServiceMonitor serviceMonitor;

    public MonitoringScheduler(ServiceMonitor serviceMonitor) {
        this.serviceMonitor = serviceMonitor;
    }

    // 시작 직후 실행 후 완료 시점 기준 5분 간격 상태 확인
    @Scheduled(fixedDelay = PortfolioConstants.Monitoring.CHECK_INTERVAL_MS)
    public void checkServices() {
        serviceMonitor.checkAll();
    }
}
