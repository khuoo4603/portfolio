package com.khuoo.portfolio.tool.repository;

import com.khuoo.portfolio.tool.domain.Tool;
import com.khuoo.portfolio.tool.domain.ToolLink;
import com.khuoo.portfolio.tool.domain.ToolQuiz;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

// JPA 기반 Tool 단건 저장·변경 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ToolRepositoryImpl implements ToolRepository {

    private final EntityManager entityManager;

    // Tool Key 기반 Registry 조회
    @Override
    public Optional<Tool> findTool(String toolKey) {
        return Optional.ofNullable(entityManager.find(Tool.class, toolKey));
    }

    // Tool Link 식별자 조회
    @Override
    public Optional<ToolLink> findLink(Long linkId) {
        return Optional.ofNullable(entityManager.find(ToolLink.class, linkId));
    }

    // 신규 Tool Link 저장과 DB 생성시각 재조회
    @Override
    @Transactional
    public ToolLink saveLink(ToolLink link) {
        entityManager.persist(link);
        entityManager.flush();
        entityManager.refresh(link);
        return link;
    }

    // Tool Link 삭제
    @Override
    @Transactional
    public void deleteLink(ToolLink link) {
        entityManager.remove(link);
    }

    // 사용자 소유 Quiz 단건 조회
    @Override
    public Optional<ToolQuiz> findOwnedQuiz(Long quizId, Long accountId) {
        return entityManager.createQuery("""
                        SELECT quiz
                        FROM ToolQuiz quiz
                        WHERE quiz.id = :quizId
                          AND quiz.accountId = :accountId
                        """, ToolQuiz.class)
                .setParameter("quizId", quizId)
                .setParameter("accountId", accountId)
                .getResultStream()
                .findFirst();
    }

    // 신규 Quiz 저장과 DB 생성시각 수신
    @Override
    @Transactional
    public ToolQuiz saveQuiz(ToolQuiz quiz) {
        entityManager.persist(quiz);
        entityManager.flush();
        entityManager.refresh(quiz);
        return quiz;
    }

    // Quiz 삭제
    @Override
    @Transactional
    public void deleteQuiz(ToolQuiz quiz) {
        entityManager.remove(quiz);
    }

    // 현재 Transaction 변경 SQL 즉시 반영
    @Override
    @Transactional
    public void flush() {
        entityManager.flush();
    }
}
