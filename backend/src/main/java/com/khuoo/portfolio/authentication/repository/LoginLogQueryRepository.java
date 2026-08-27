package com.khuoo.portfolio.authentication.repository;

import java.time.OffsetDateTime;

// 로그인 제한 판단용 Credential 실패 기록 집계 경계
public interface LoginLogQueryRepository {

    // 지정 시각 이후 이메일 Credential 실패 횟수 조회
    long countFailuresByEmailSince(String email, OffsetDateTime since);

    // 지정 시각 이후 IP Credential 실패 횟수 조회
    long countFailuresByIpSince(String ipAddress, OffsetDateTime since);
}
