package com.khuoo.portfolio.authentication.repository;

import com.khuoo.portfolio.authentication.domain.LoginLog;
import com.khuoo.portfolio.monitoring.domain.LoginResult;

import java.time.OffsetDateTime;
import java.util.List;

// 로그인 제한 판단용 Credential 실패 기록 집계 경계
public interface LoginLogQueryRepository {

    // 지정 시각 이후 이메일 Credential 실패 횟수 조회
    long countFailuresByEmailSince(String email, OffsetDateTime since);

    // 지정 시각 이후 IP Credential 실패 횟수 조회
    long countFailuresByIpSince(String ipAddress, OffsetDateTime since);

    // 관리자 조건과 Pagination 기반 로그인 기록 조회
    LoginLogPage findLogs(
            OffsetDateTime from,
            OffsetDateTime to,
            String email,
            LoginResult result,
            int page,
            int size
    );

    // 로그인 기록 Page 조회값
    record LoginLogPage(List<LoginLog> items, long totalElements) {
    }
}
