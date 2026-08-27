package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.monitoring.domain.ErrorLog;

import java.time.OffsetDateTime;

// HTTP 5xx 요약 기록 저장 경계
public interface ErrorLogRepository {

    // HTTP 5xx 요약 기록 독립 저장
    ErrorLog save(ErrorLog errorLog);

    // 보관 경계 이전 오류 기록 일괄 삭제
    long deleteBefore(OffsetDateTime cutoff);
}
