package com.khuoo.portfolio.account.repository;

import com.khuoo.portfolio.account.domain.Account;

import java.util.List;
import java.util.Optional;

// 인증에 필요한 계정 단건 조회 경계
public interface AccountRepository {

    // 이메일 기준 계정 조회
    Optional<Account> findByEmail(String email);

    // 식별자 기준 계정 조회
    Optional<Account> findById(Long id);

    // 정규화 이메일 존재 여부 조회
    boolean existsByEmail(String email);

    // 신규 계정 저장과 생성시각 반영
    Account save(Account account);

    // 마지막 ADMIN 보호용 활성 ADMIN 배타 잠금 조회
    List<Account> lockActiveAdmins();
}
