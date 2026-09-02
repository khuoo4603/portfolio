package com.khuoo.portfolio.account.repository;

import com.khuoo.portfolio.account.domain.Account;

import java.time.OffsetDateTime;

// 관리자 계정 목록과 최근 성공 로그인시각 조회 결과
public record AccountListEntry(
        Account account,
        OffsetDateTime recentLoginAt
) {
}
