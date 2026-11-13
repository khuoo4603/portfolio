package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.monitoring.domain.MonitoringTarget;
import jakarta.persistence.EntityManager;
import jakarta.persistence.LockModeType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

// JPA 기반 Monitoring 대상 단건 변경 Repository 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MonitoringTargetRepositoryImpl implements MonitoringTargetRepository {

    private final EntityManager entityManager;

    // Target ID 기반 조회
    @Override
    public Optional<MonitoringTarget> findTarget(Long targetId) {
        return Optional.ofNullable(entityManager.find(MonitoringTarget.class, targetId));
    }

    // Monitoring 대상의 현재 순서 확인과 동시 변경 방지
    @Override
    public List<MonitoringTarget> findTargetsForUpdate() {
        return entityManager.createQuery("""
                        SELECT target
                        FROM MonitoringTarget target
                        ORDER BY target.displayOrder ASC, target.id ASC
                        """, MonitoringTarget.class)
                .setLockMode(LockModeType.PESSIMISTIC_WRITE)
                .getResultList();
    }

    // Service Key 중복 여부 조회
    @Override
    public boolean existsServiceKey(String serviceKey) {
        return entityManager.createQuery("""
                        SELECT COUNT(target)
                        FROM MonitoringTarget target
                        WHERE target.serviceKey = :serviceKey
                        """, Long.class)
                .setParameter("serviceKey", serviceKey)
                .getSingleResult() > 0;
    }

    // Target 저장과 DB 생성 시각 반영
    @Override
    @Transactional
    public MonitoringTarget saveTarget(MonitoringTarget target) {
        entityManager.persist(target);
        entityManager.flush();
        entityManager.refresh(target);
        return target;
    }

    // 변경 SQL 즉시 반영
    @Override
    @Transactional
    public void flush() {
        entityManager.flush();
    }
}
