package com.khuoo.portfolio.tool.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.ToolLinkCategory;
import com.khuoo.portfolio.tool.domain.Tool;
import com.khuoo.portfolio.tool.domain.ToolLink;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

// JPA 기반 Tool Launcher와 Links 목록 조회 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ToolQueryRepositoryImpl implements ToolQueryRepository {

    private final EntityManager entityManager;

    // 활성 상태와 고정 Tool Key 순서 기반 Registry 조회
    @Override
    public List<Tool> findEnabledTools() {
        return entityManager.createQuery("""
                        SELECT tool
                        FROM Tool tool
                        WHERE tool.enabled = true
                        ORDER BY tool.toolKey DESC
                        """, Tool.class)
                .getResultList();
    }

    // 비활성 포함 고정 Tool Key 순서 기반 Registry 전체 조회
    @Override
    public List<Tool> findTools() {
        return entityManager.createQuery("""
                        SELECT tool
                        FROM Tool tool
                        ORDER BY tool.toolKey DESC
                        """, Tool.class)
                .getResultList();
    }

    // 공개 상태와 표시 순서를 반영한 Tool Link 조회
    @Override
    public List<ToolLink> findEnabledLinks(ToolLinkCategory category) {
        if (category == null) {
            return entityManager.createQuery("""
                            SELECT link
                            FROM ToolLink link
                            WHERE link.enabled = true
                            ORDER BY link.displayOrder ASC, link.id ASC
                            """, ToolLink.class)
                    .getResultList();
        }
        return entityManager.createQuery("""
                        SELECT link
                        FROM ToolLink link
                        WHERE link.enabled = true
                          AND link.category = :category
                        ORDER BY link.displayOrder ASC, link.id ASC
                        """, ToolLink.class)
                .setParameter("category", category)
                .getResultList();
    }

    // 비활성 포함 표시 순서 기반 Tool Link 전체 조회
    @Override
    public List<ToolLink> findLinks() {
        return entityManager.createQuery("""
                        SELECT link
                        FROM ToolLink link
                        ORDER BY link.displayOrder ASC, link.id ASC
                        """, ToolLink.class)
                .getResultList();
    }

    // JSONB 본문을 제외한 사용자 소유 Quiz 최근 수정순 요약 조회
    @Override
    public List<QuizSummaryView> findQuizSummaries(Long accountId) {
        return entityManager.createQuery("""
                        SELECT new com.khuoo.portfolio.tool.repository.QuizSummaryView(
                            quiz.id,
                            quiz.title,
                            quiz.createdAt,
                            quiz.updatedAt
                        )
                        FROM ToolQuiz quiz
                        WHERE quiz.accountId = :accountId
                        ORDER BY quiz.updatedAt DESC
                        """, QuizSummaryView.class)
                .setParameter("accountId", accountId)
                .getResultList();
    }
}
