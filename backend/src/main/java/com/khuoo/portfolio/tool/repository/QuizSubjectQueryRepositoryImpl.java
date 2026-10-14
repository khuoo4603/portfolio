package com.khuoo.portfolio.tool.repository;

import com.khuoo.portfolio.tool.domain.ToolQuizSubject;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// JPA 기반 Quiz 과목 생성순 목록 조회 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizSubjectQueryRepositoryImpl implements QuizSubjectQueryRepository {

    private final EntityManager entityManager;

    // 계정별 과목 생성순 목록 조회
    @Override
    public List<ToolQuizSubject> findSubjects(Long accountId) {
        return entityManager.createQuery("""
                        SELECT subject
                        FROM ToolQuizSubject subject
                        WHERE subject.accountId = :accountId
                        ORDER BY subject.createdAt ASC, subject.id ASC
                        """, ToolQuizSubject.class)
                .setParameter("accountId", accountId)
                .getResultList();
    }
}
