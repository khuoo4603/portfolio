package com.khuoo.portfolio.tool.repository;

import com.khuoo.portfolio.tool.domain.ToolQuizSubject;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.Optional;

// JPA 기반 Quiz 과목 단건 저장과 소유자 범위 변경 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class QuizSubjectRepositoryImpl implements QuizSubjectRepository {

    private final EntityManager entityManager;

    // 현재 계정 소유 과목 단건 조회
    @Override
    public Optional<ToolQuizSubject> findOwned(Long subjectId, Long accountId) {
        return entityManager.createQuery("""
                        SELECT subject
                        FROM ToolQuizSubject subject
                        WHERE subject.id = :subjectId
                          AND subject.accountId = :accountId
                        """, ToolQuizSubject.class)
                .setParameter("subjectId", subjectId)
                .setParameter("accountId", accountId)
                .getResultStream()
                .findFirst();
    }

    // 동일 계정 과목명 중복 여부 조회
    @Override
    public boolean existsName(Long accountId, String name, Long excludedSubjectId) {
        String condition = excludedSubjectId == null ? "" : " AND subject.id <> :subjectId";
        var query = entityManager.createQuery("""
                        SELECT COUNT(subject)
                        FROM ToolQuizSubject subject
                        WHERE subject.accountId = :accountId
                          AND subject.name = :name
                        """ + condition, Long.class)
                .setParameter("accountId", accountId)
                .setParameter("name", name);
        if (excludedSubjectId != null) {
            query.setParameter("subjectId", excludedSubjectId);
        }
        return query.getSingleResult() > 0;
    }

    // 신규 과목 저장과 DB 생성 시각 조회
    @Override
    @Transactional
    public ToolQuizSubject save(ToolQuizSubject subject) {
        entityManager.persist(subject);
        entityManager.flush();
        entityManager.refresh(subject);
        return subject;
    }

    // 과목 소속 Quiz 연결 해제와 수정 시각 갱신
    @Override
    @Transactional
    public void clearQuizSubject(Long subjectId, Long accountId, OffsetDateTime changedAt) {
        entityManager.createQuery("""
                        UPDATE ToolQuiz quiz
                        SET quiz.subjectId = NULL,
                            quiz.updatedAt = :changedAt
                        WHERE quiz.subjectId = :subjectId
                          AND quiz.accountId = :accountId
                        """)
                .setParameter("subjectId", subjectId)
                .setParameter("accountId", accountId)
                .setParameter("changedAt", changedAt)
                .executeUpdate();
    }

    // 과목 삭제
    @Override
    @Transactional
    public void delete(ToolQuizSubject subject) {
        entityManager.remove(subject);
    }

    // 변경 SQL 즉시 반영
    @Override
    @Transactional
    public void flush() {
        entityManager.flush();
    }
}
