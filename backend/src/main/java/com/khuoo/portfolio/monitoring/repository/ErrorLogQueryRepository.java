package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.ErrorService;
import com.khuoo.portfolio.monitoring.domain.ErrorLog;

import java.time.OffsetDateTime;
import java.util.List;

// HTTP 5xx 요약 기록 필터·Pagination 조회 경계
public interface ErrorLogQueryRepository {

    // 관리자 조건과 Pagination 기반 오류 기록 조회
    ErrorLogPage findLogs(
            OffsetDateTime from,
            OffsetDateTime to,
            ErrorService service,
            Integer statusCode,
            int page,
            int size
    );

    // 오류 기록 Page 조회값
    record ErrorLogPage(List<ErrorLog> items, long totalElements) {
    }
}
