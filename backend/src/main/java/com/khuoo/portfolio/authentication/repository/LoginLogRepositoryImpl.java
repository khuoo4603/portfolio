package com.khuoo.portfolio.authentication.repository;

import com.khuoo.portfolio.authentication.domain.LoginLog;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

// JPA 기반 로그인 감사 기록 저장 구현
@Repository
@RequiredArgsConstructor
public class LoginLogRepositoryImpl implements LoginLogRepository {

    private final EntityManager entityManager;

    // 로그인 성공·실패 기록 독립 저장
    @Override
    @Transactional
    public LoginLog save(LoginLog loginLog) {
        entityManager.persist(loginLog);
        return loginLog;
    }

    // 보관 경계 이전 로그인 기록 일괄 삭제
    @Override
    @Transactional
    public long deleteBefore(OffsetDateTime cutoff) {
        return entityManager.createQuery("""
                        DELETE FROM LoginLog login
                        WHERE login.occurredAt < :cutoff
                        """)
                .setParameter("cutoff", cutoff)
                .executeUpdate();
    }
}
