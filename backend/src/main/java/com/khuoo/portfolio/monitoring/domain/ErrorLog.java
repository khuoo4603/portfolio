package com.khuoo.portfolio.monitoring.domain;

import com.khuoo.portfolio.common.util.PortfolioEnums.ErrorService;
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

// Portfolio HTTP 5xx 관리자 조회용 요약 기록
@Getter
@Entity
@Table(name = "error_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ErrorLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "occurred_at", nullable = false)
    private OffsetDateTime occurredAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ErrorService service;

    @Column(length = 10)
    private String method;

    @Column(length = 1000)
    private String path;

    @Column(name = "status_code", nullable = false)
    private short statusCode;

    @Column(name = "error_code", length = 100)
    private String errorCode;

    @Column(nullable = false, length = 500)
    private String message;

    @Column(name = "trace_id", nullable = false, length = 64)
    private String traceId;

    private ErrorLog(
            OffsetDateTime occurredAt,
            ErrorService service,
            String method,
            String path,
            int statusCode,
            String errorCode,
            String message,
            String traceId
    ) {
        this.occurredAt = occurredAt;
        this.service = service;
        this.method = method;
        this.path = path;
        this.statusCode = (short) statusCode;
        this.errorCode = errorCode;
        this.message = message;
        this.traceId = traceId;
    }

    // 검증 완료 HTTP 5xx 요약 기록 생성
    public static ErrorLog create(
            OffsetDateTime occurredAt,
            ErrorService service,
            String method,
            String path,
            int statusCode,
            String errorCode,
            String message,
            String traceId
    ) {
        return new ErrorLog(
                occurredAt,
                service,
                method,
                path,
                statusCode,
                errorCode,
                message,
                traceId
        );
    }
}
