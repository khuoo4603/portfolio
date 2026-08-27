package com.khuoo.portfolio.account.repository;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.common.util.EmailNormalizer;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

import static com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole.ADMIN;

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

    // 정규화 이메일 존재 여부 조회
    @Override
    public boolean existsByEmail(String email) {
        return entityManager.createQuery(
                        "SELECT COUNT(account) FROM Account account WHERE account.email = :email",
                        Long.class
                )
                .setParameter("email", EmailNormalizer.normalize(email))
                .getSingleResult() > 0;
    }

    // 신규 계정 저장과 DB 생성시각 재조회
    @Override
    @Transactional
    public Account save(Account account) {
        entityManager.persist(account);
        entityManager.flush();
        entityManager.refresh(account);
        return account;
    }

    // 활성 ADMIN 행 전체 배타 잠금 조회
    @Override
    public List<Account> lockActiveAdmins() {
        return entityManager.createQuery("""
                        SELECT account
                        FROM Account account
                        WHERE account.role = :role
                          AND account.enabled = true
                        ORDER BY account.id
                        """, Account.class)
                .setParameter("role", ADMIN)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultList();
    }
}
