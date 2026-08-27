package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.monitoring.domain.ErrorLog;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;

// JPA 기반 HTTP 5xx 요약 기록 저장 구현
@Repository
@RequiredArgsConstructor
public class ErrorLogRepositoryImpl implements ErrorLogRepository {

    private final EntityManager entityManager;

    // 원래 오류 처리 Transaction과 분리한 요약 기록 저장
    @Override
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public ErrorLog save(ErrorLog errorLog) {
        entityManager.persist(errorLog);
        return errorLog;
    }

    // 보관 경계 이전 오류 기록 일괄 삭제
    @Override
    @Transactional
    public long deleteBefore(OffsetDateTime cutoff) {
        return entityManager.createQuery("""
                        DELETE FROM ErrorLog error
                        WHERE error.occurredAt < :cutoff
                        """)
                .setParameter("cutoff", cutoff)
                .executeUpdate();
    }
}
