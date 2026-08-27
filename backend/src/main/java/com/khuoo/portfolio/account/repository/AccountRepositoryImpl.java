package com.khuoo.portfolio.account.repository;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.common.util.EmailNormalizer;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

// JPA 기반 계정 단건 조회 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountRepositoryImpl implements AccountRepository {

    private final EntityManager entityManager;

    // 정규화 이메일 기준 계정 조회
    @Override
    public Optional<Account> findByEmail(String email) {
        return entityManager.createQuery(
                        "SELECT account FROM Account account WHERE account.email = :email",
                        Account.class
                )
                .setParameter("email", EmailNormalizer.normalize(email))
                .getResultStream()
                .findFirst();
    }

    // 식별자 기준 계정 조회
    @Override
    public Optional<Account> findById(Long id) {
        return Optional.ofNullable(entityManager.find(Account.class, id));
    }
}
