package com.khuoo.portfolio.authentication.domain;

import com.khuoo.portfolio.common.util.PortfolioEnums.DeviceType;
import com.khuoo.portfolio.common.util.PortfolioEnums.LoginEventType;
import com.khuoo.portfolio.common.util.PortfolioEnums.LoginFailureReason;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

// 로그인 성공·실패 감사 기록
@Getter
@Entity
@Table(name = "login_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LoginLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;

    @Column(name = "account_id")
    private Long accountId;

    @Column(nullable = false, length = 255)
    private String email;

    @Enumerated(EnumType.STRING)
    @Column(name = "event_type", nullable = false, length = 40)
    private LoginEventType eventType;

    @Column(nullable = false)
    private boolean success;

    @Enumerated(EnumType.STRING)
    @Column(name = "failure_reason", length = 100)
    private LoginFailureReason failureReason;

    @Column(name = "ip_address", nullable = false, length = 45)
    private String ipAddress;

    @Column(name = "user_agent")
    private String userAgent;

    @Column(length = 100)
    private String browser;

    @Column(name = "operating_system", length = 100)
    private String operatingSystem;

    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private DeviceType device;

    @Column(name = "trace_id", nullable = false, length = 64)
    private String traceId;

    private LoginLog(
            OffsetDateTime occurredAt,
            Long accountId,
            String email,
            LoginEventType eventType,
            boolean success,
            LoginFailureReason failureReason,
            ClientInfo clientInfo,
            String traceId
    ) {
        this.occurredAt = occurredAt;
        this.accountId = accountId;
        this.email = email;
        this.eventType = eventType;
        this.success = success;
        this.failureReason = failureReason;
        this.ipAddress = clientInfo.ipAddress();
        this.userAgent = clientInfo.userAgent();
        this.browser = clientInfo.browser();
        this.operatingSystem = clientInfo.operatingSystem();
        this.device = clientInfo.device();
        this.traceId = traceId;
    }

    // 최종 로그인 성공 기록 생성
    public static LoginLog success(
            OffsetDateTime occurredAt,
            Long accountId,
            String email,
            ClientInfo clientInfo,
            String traceId
    ) {
        return new LoginLog(
                occurredAt,
                accountId,
                email,
                LoginEventType.LOGIN_SUCCESS,
                true,
                null,
                clientInfo,
                traceId
        );
    }

    // 내부 실패 사유를 포함한 로그인 실패 기록 생성
    public static LoginLog failure(
            OffsetDateTime occurredAt,
            Long accountId,
            String email,
            LoginFailureReason failureReason,
            ClientInfo clientInfo,
            String traceId
    ) {
        return new LoginLog(
                occurredAt,
                accountId,
                email,
                LoginEventType.LOGIN_FAILURE,
                false,
                failureReason,
                clientInfo,
                traceId
        );
    }
}
