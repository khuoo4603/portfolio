package com.khuoo.portfolio.account.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;

import java.util.List;

// 관리자 계정 목록 필터·검색 조회 경계
public interface AccountQueryRepository {

    // 선택 조건과 최근 성공 로그인시각을 포함한 계정 목록 조회
    List<AccountListEntry> findAll(AccountRole role, Boolean enabled, String keyword);
}
