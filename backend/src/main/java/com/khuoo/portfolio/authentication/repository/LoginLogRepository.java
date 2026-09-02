package com.khuoo.portfolio.authentication.repository;

import com.khuoo.portfolio.authentication.domain.LoginLog;

import java.time.OffsetDateTime;

// 로그인 감사 기록 저장 경계
public interface LoginLogRepository {

    // 로그인 성공·실패 기록 저장
    LoginLog save(LoginLog loginLog);

    // 보관 경계 이전 로그인 기록 일괄 삭제
    long deleteBefore(OffsetDateTime cutoff);
}
