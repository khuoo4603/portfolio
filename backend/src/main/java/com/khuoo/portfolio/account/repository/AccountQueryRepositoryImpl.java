package com.khuoo.portfolio.account.repository;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import com.khuoo.portfolio.common.util.PortfolioEnums.LoginEventType;
import jakarta.persistence.EntityManager;
import jakarta.persistence.TypedQuery;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

// JPA 기반 계정 목록 필터와 최근 성공 로그인 집계 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AccountQueryRepositoryImpl implements AccountQueryRepository {

    private final EntityManager entityManager;

    // 계정 조건 조회와 단일 Login Log 집계 조합
    @Override
    public List<AccountListEntry> findAll(AccountRole role, Boolean enabled, String keyword) {
        String normalizedKeyword = keyword == null ? null : keyword.trim().toLowerCase(Locale.ROOT);
        StringBuilder jpql = new StringBuilder("SELECT account FROM Account account WHERE 1 = 1");
        if (role != null) {
            jpql.append(" AND account.role = :role");
        }
        if (enabled != null) {
            jpql.append(" AND account.enabled = :enabled");
        }
        if (normalizedKeyword != null && !normalizedKeyword.isBlank()) {
            jpql.append(" AND (LOWER(account.email) LIKE :keyword OR LOWER(account.name) LIKE :keyword)");
        }
        jpql.append(" ORDER BY account.id ASC");

        TypedQuery<Account> query = entityManager.createQuery(jpql.toString(), Account.class);
        if (role != null) {
            query.setParameter("role", role);
        }
        if (enabled != null) {
            query.setParameter("enabled", enabled);
        }
        if (normalizedKeyword != null && !normalizedKeyword.isBlank()) {
            query.setParameter("keyword", "%" + normalizedKeyword + "%");
        }

        List<Account> accounts = query.getResultList();
        if (accounts.isEmpty()) {
            return List.of();
        }

        Map<Long, OffsetDateTime> recentLogins = recentLogins(accounts);
        return accounts.stream()
                .map(account -> new AccountListEntry(account, recentLogins.get(account.getId())))
                .toList();
    }

    private Map<Long, OffsetDateTime> recentLogins(List<Account> accounts) {
        List<Long> accountIds = accounts.stream().map(Account::getId).toList();
        List<Object[]> rows = entityManager.createQuery("""
                        SELECT login.accountId, MAX(login.occurredAt)
                        FROM LoginLog login
                        WHERE login.accountId IN :accountIds
                          AND login.eventType = :eventType
                        GROUP BY login.accountId
                        """, Object[].class)
                .setParameter("accountIds", accountIds)
                .setParameter("eventType", LoginEventType.LOGIN_SUCCESS)
                .getResultList();

        Map<Long, OffsetDateTime> recentLogins = new HashMap<>();
        for (Object[] row : rows) {
            recentLogins.put((Long) row[0], (OffsetDateTime) row[1]);
        }
        return recentLogins;
    }
}
