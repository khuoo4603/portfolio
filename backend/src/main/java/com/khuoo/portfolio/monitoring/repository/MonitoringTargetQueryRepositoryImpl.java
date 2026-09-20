package com.khuoo.portfolio.monitoring.repository;

import com.khuoo.portfolio.monitoring.domain.MonitoringTarget;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// JPA 기반 Monitoring 대상 목록 조회 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MonitoringTargetQueryRepositoryImpl implements MonitoringTargetQueryRepository {

    private final EntityManager entityManager;

    // 표시 순서 기반 전체 대상 조회
    @Override
    public List<MonitoringTarget> findAll() {
        return entityManager.createQuery("""
                        SELECT target
                        FROM MonitoringTarget target
                        ORDER BY target.displayOrder ASC, target.id ASC
                        """, MonitoringTarget.class)
                .getResultList();
    }

    // Runtime 실행용 활성 대상 조회
    @Override
    public List<MonitoringTarget> findEnabled() {
        return entityManager.createQuery("""
                        SELECT target
                        FROM MonitoringTarget target
                        WHERE target.enabled = TRUE
                        ORDER BY target.displayOrder ASC, target.id ASC
                        """, MonitoringTarget.class)
                .getResultList();
    }
}
