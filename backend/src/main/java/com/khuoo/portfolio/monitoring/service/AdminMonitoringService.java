package com.khuoo.portfolio.monitoring.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.validation.PatchValues;
import com.khuoo.portfolio.common.validation.WebUrlValidator;
import com.khuoo.portfolio.monitoring.domain.MonitoringSettings;
import com.khuoo.portfolio.monitoring.domain.MonitoringTarget;
import com.khuoo.portfolio.monitoring.dto.AdminMonitoringResponse;
import com.khuoo.portfolio.monitoring.dto.MonitoringSettingsResponse;
import com.khuoo.portfolio.monitoring.dto.MonitoringSettingsUpdateRequest;
import com.khuoo.portfolio.monitoring.dto.MonitoringTargetCreateRequest;
import com.khuoo.portfolio.monitoring.dto.MonitoringTargetResponse;
import com.khuoo.portfolio.monitoring.dto.MonitoringTargetUpdateRequest;
import com.khuoo.portfolio.monitoring.repository.MonitoringSettingsQueryRepository;
import com.khuoo.portfolio.monitoring.repository.MonitoringSettingsRepository;
import com.khuoo.portfolio.monitoring.repository.MonitoringTargetQueryRepository;
import com.khuoo.portfolio.monitoring.repository.MonitoringTargetRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;

// 관리자 Monitoring 설정과 대상 관리 서비스
@Service
@RequiredArgsConstructor
public class AdminMonitoringService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final MonitoringSettingsRepository monitoringSettingsRepository;
    private final MonitoringSettingsQueryRepository monitoringSettingsQueryRepository;
    private final MonitoringTargetRepository monitoringTargetRepository;
    private final MonitoringTargetQueryRepository monitoringTargetQueryRepository;
    private final WebUrlValidator webUrlValidator;

    // Monitoring 설정과 전체 대상 통합 조회
    public AdminMonitoringResponse findAll() {
        MonitoringSettings settings = requireCurrentSettings();
        return new AdminMonitoringResponse(
                MonitoringSettingsResponse.from(settings),
                monitoringTargetQueryRepository.findAll().stream()
                        .map(MonitoringTargetResponse::from)
                        .toList()
        );
    }

    // 미전달 필드 보존 Monitoring 설정 수정
    @Transactional
    public MonitoringSettingsResponse updateSettings(MonitoringSettingsUpdateRequest request) {
        MonitoringSettings settings = requireSettings();
        PatchValues.requireAny(
                request.enabled(),
                request.checkIntervalSeconds(),
                request.connectTimeoutMs(),
                request.requestTimeoutMs(),
                request.retryDelayMs(),
                request.maxRetries()
        );
        boolean enabled = PatchValues.present(request.enabled())
                ? PatchValues.booleanValue(request.enabled())
                : settings.isEnabled();
        int checkIntervalSeconds = PatchValues.present(request.checkIntervalSeconds())
                ? PatchValues.positiveInt(request.checkIntervalSeconds())
                : settings.getCheckIntervalSeconds();
        int connectTimeoutMs = PatchValues.present(request.connectTimeoutMs())
                ? PatchValues.positiveInt(request.connectTimeoutMs())
                : settings.getConnectTimeoutMs();
        int requestTimeoutMs = PatchValues.present(request.requestTimeoutMs())
                ? PatchValues.positiveInt(request.requestTimeoutMs())
                : settings.getRequestTimeoutMs();
        int retryDelayMs = PatchValues.present(request.retryDelayMs())
                ? PatchValues.nonNegativeInt(request.retryDelayMs())
                : settings.getRetryDelayMs();
        int maxRetries = PatchValues.present(request.maxRetries())
                ? PatchValues.nonNegativeInt(request.maxRetries())
                : settings.getMaxRetries();

        settings.update(
                enabled,
                checkIntervalSeconds,
                connectTimeoutMs,
                requestTimeoutMs,
                retryDelayMs,
                maxRetries,
                now()
        );
        monitoringSettingsRepository.flush();
        return MonitoringSettingsResponse.from(settings);
    }

    // 신규 Monitoring 대상 생성
    @Transactional
    public MonitoringTargetResponse createTarget(MonitoringTargetCreateRequest request) {
        if (monitoringTargetRepository.existsServiceKey(request.serviceKey())) {
            throw new ApiException(ErrorCode.MONITORING_TARGET_KEY_CONFLICT);
        }
        validateHealthUrl(request.enabled(), request.healthUrl());
        MonitoringTarget target = MonitoringTarget.create(
                request.serviceKey(),
                request.displayName(),
                request.healthUrl(),
                request.enabled(),
                request.displayOrder()
        );
        return MonitoringTargetResponse.from(monitoringTargetRepository.saveTarget(target));
    }

    // 미전달 필드 보존 Monitoring 대상 수정
    @Transactional
    public MonitoringTargetResponse updateTarget(Long targetId, MonitoringTargetUpdateRequest request) {
        MonitoringTarget target = requireTarget(targetId);
        if (PatchValues.present(request.serviceKey())) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        PatchValues.requireAny(
                request.displayName(),
                request.healthUrl(),
                request.enabled(),
                request.displayOrder()
        );
        String displayName = PatchValues.present(request.displayName())
                ? PatchValues.requiredString(request.displayName(), 100)
                : target.getDisplayName();
        String healthUrl = PatchValues.present(request.healthUrl())
                ? PatchValues.nullableString(request.healthUrl(), Integer.MAX_VALUE)
                : target.getHealthUrl();
        boolean enabled = PatchValues.present(request.enabled())
                ? PatchValues.booleanValue(request.enabled())
                : target.isEnabled();
        int displayOrder = PatchValues.present(request.displayOrder())
                ? PatchValues.nonNegativeInt(request.displayOrder())
                : target.getDisplayOrder();
        validateHealthUrl(enabled, healthUrl);

        target.update(displayName, healthUrl, enabled, displayOrder, now());
        monitoringTargetRepository.flush();
        return MonitoringTargetResponse.from(target);
    }

    private MonitoringSettings requireCurrentSettings() {
        return monitoringSettingsQueryRepository.findCurrent()
                .orElseThrow(() -> new ApiException(ErrorCode.MONITORING_SETTINGS_NOT_FOUND));
    }

    private MonitoringSettings requireSettings() {
        return monitoringSettingsRepository.findSettings()
                .orElseThrow(() -> new ApiException(ErrorCode.MONITORING_SETTINGS_NOT_FOUND));
    }

    private MonitoringTarget requireTarget(Long targetId) {
        return monitoringTargetRepository.findTarget(targetId)
                .orElseThrow(() -> new ApiException(ErrorCode.MONITORING_TARGET_NOT_FOUND));
    }

    private void validateHealthUrl(boolean enabled, String healthUrl) {
        if (enabled && healthUrl == null) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        if (healthUrl != null) {
            webUrlValidator.validate(healthUrl);
        }
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
