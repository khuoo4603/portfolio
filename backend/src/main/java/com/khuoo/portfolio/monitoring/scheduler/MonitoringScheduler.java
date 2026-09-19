package com.khuoo.portfolio.monitoring.scheduler;

import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.monitoring.repository.MonitoringSettingsQueryRepository;
import com.khuoo.portfolio.monitoring.service.ServiceMonitor;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.scheduling.Trigger;
import org.springframework.scheduling.TriggerContext;
import org.springframework.scheduling.TaskScheduler;

import java.time.Duration;
import java.time.Instant;

// 비웹 Monitor Context의 DB 주기 상태 확인 Scheduler
public class MonitoringScheduler implements Trigger {

    private static final Duration SETTINGS_FAILURE_FALLBACK_DELAY = Duration.ofMinutes(5);

    private final ServiceMonitor serviceMonitor;
    private final MonitoringSettingsQueryRepository monitoringSettingsQueryRepository;
    private final LogEventLogger logEventLogger;
    private final TaskScheduler taskScheduler;

    public MonitoringScheduler(
            ServiceMonitor serviceMonitor,
            MonitoringSettingsQueryRepository monitoringSettingsQueryRepository,
            LogEventLogger logEventLogger,
            TaskScheduler taskScheduler
    ) {
        this.serviceMonitor = serviceMonitor;
        this.monitoringSettingsQueryRepository = monitoringSettingsQueryRepository;
        this.logEventLogger = logEventLogger;
        this.taskScheduler = taskScheduler;
    }

    // Application 준비 완료 후 Trigger 기반 실행 등록
    @EventListener(ApplicationReadyEvent.class)
    public void schedule() {
        taskScheduler.schedule(this::checkServices, this);
    }

    // 완료 시각 기준 DB 설정 주기 다음 실행시각 계산
    @Override
    public Instant nextExecution(TriggerContext triggerContext) {
        Instant lastCompletion = triggerContext.lastCompletion();
        if (lastCompletion == null) {
            return Instant.now();
        }
        try {
            Duration interval = monitoringSettingsQueryRepository.findCurrent()
                    .map(settings -> Duration.ofSeconds(settings.getCheckIntervalSeconds()))
                    .filter(value -> !value.isZero() && !value.isNegative())
                    .orElseThrow(() -> new IllegalStateException("Monitoring Runtime 설정 없음"));
            return lastCompletion.plus(interval);
        } catch (RuntimeException exception) {
            logEventLogger.error("monitoring.schedule.failure", "Monitoring 주기 설정 조회 실패", exception);
            return lastCompletion.plus(SETTINGS_FAILURE_FALLBACK_DELAY);
        }
    }

    // 단일 Monitoring Cycle 실행 위임
    public void checkServices() {
        serviceMonitor.checkAll();
    }
}
