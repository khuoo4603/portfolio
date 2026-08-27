package com.khuoo.portfolio.monitoring.service;

import com.khuoo.portfolio.authentication.domain.LoginLog;
import com.khuoo.portfolio.authentication.repository.LoginLogQueryRepository;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.EmailNormalizer;
import com.khuoo.portfolio.common.util.PageSupport;
import com.khuoo.portfolio.common.util.PortfolioEnums.DeviceType;
import com.khuoo.portfolio.common.util.PortfolioEnums.ErrorService;
import com.khuoo.portfolio.monitoring.domain.ErrorLog;
import com.khuoo.portfolio.monitoring.domain.LoginResult;
import com.khuoo.portfolio.monitoring.dto.ErrorLogListResponse;
import com.khuoo.portfolio.monitoring.dto.LoginLogListResponse;
import com.khuoo.portfolio.monitoring.repository.ErrorLogQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

// 관리자 로그인·HTTP 5xx 기록 조회 처리
@Service
@RequiredArgsConstructor
public class AdminLogService {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    private final LoginLogQueryRepository loginLogQueryRepository;
    private final ErrorLogQueryRepository errorLogQueryRepository;

    // 기간·이메일·결과 기반 로그인 기록 조회
    public LoginLogListResponse findLogins(
            OffsetDateTime from,
            OffsetDateTime to,
            String email,
            LoginResult result,
            Integer page,
            Integer size
    ) {
        validateRange(from, to);
        PageSupport.PageRequest pagination = PageSupport.normalize(page, size);
        LoginLogQueryRepository.LoginLogPage logs = loginLogQueryRepository.findLogs(
                from,
                to,
                EmailNormalizer.normalize(email),
                result,
                pagination.page(),
                pagination.size()
        );
        return new LoginLogListResponse(
                logs.items().stream().map(this::loginItem).toList(),
                pagination.page(),
                pagination.size(),
                logs.totalElements()
        );
    }

    // 기간·서비스·HTTP Status 기반 오류 기록 조회
    public ErrorLogListResponse findErrors(
            OffsetDateTime from,
            OffsetDateTime to,
            ErrorService service,
            Integer statusCode,
            Integer page,
            Integer size
    ) {
        validateRange(from, to);
        if (statusCode != null && (statusCode < 500 || statusCode > 599)) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        PageSupport.PageRequest pagination = PageSupport.normalize(page, size);
        ErrorLogQueryRepository.ErrorLogPage logs = errorLogQueryRepository.findLogs(
                from,
                to,
                service,
                statusCode,
                pagination.page(),
                pagination.size()
        );
        return new ErrorLogListResponse(
                logs.items().stream().map(this::errorItem).toList(),
                pagination.page(),
                pagination.size(),
                logs.totalElements()
        );
    }

    private LoginLogListResponse.LoginLogItem loginItem(LoginLog log) {
        return new LoginLogListResponse.LoginLogItem(
                log.getId(),
                log.getOccurredAt().withOffsetSameInstant(KST),
                log.getEmail(),
                log.isSuccess() ? LoginResult.SUCCESS : LoginResult.FAILURE,
                log.getFailureReason(),
                log.getIpAddress(),
                log.getBrowser(),
                log.getOperatingSystem(),
                device(log.getDevice()),
                log.getTraceId()
        );
    }

    private ErrorLogListResponse.ErrorLogItem errorItem(ErrorLog log) {
        return new ErrorLogListResponse.ErrorLogItem(
                log.getId(),
                log.getOccurredAt().withOffsetSameInstant(KST),
                log.getService(),
                log.getMethod(),
                log.getPath(),
                log.getStatusCode(),
                log.getErrorCode(),
                log.getMessage(),
                log.getTraceId()
        );
    }

    private String device(DeviceType device) {
        if (device == null) {
            return null;
        }
        return switch (device) {
            case DESKTOP -> "Desktop";
            case MOBILE -> "Mobile";
            case TABLET -> "Tablet";
            case OTHER -> "Other";
        };
    }

    private void validateRange(OffsetDateTime from, OffsetDateTime to) {
        if (from != null && to != null && from.isAfter(to)) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
    }
}
