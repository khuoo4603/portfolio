package com.khuoo.portfolio.account.repository;

import com.khuoo.portfolio.account.domain.Account;

import java.util.Optional;

// 인증에 필요한 계정 단건 조회 경계
public interface AccountRepository {

    // 이메일 기준 계정 조회
    Optional<Account> findByEmail(String email);

    // 식별자 기준 계정 조회
    Optional<Account> findById(Long id);
}
