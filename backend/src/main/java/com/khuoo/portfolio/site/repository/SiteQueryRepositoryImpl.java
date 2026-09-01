package com.khuoo.portfolio.site.repository;

import com.khuoo.portfolio.site.domain.ExternalLink;
import com.khuoo.portfolio.site.domain.PortfolioContent;
import com.khuoo.portfolio.site.domain.ProfileEntry;
import com.khuoo.portfolio.site.domain.Project;
import com.khuoo.portfolio.site.domain.ResumeFile;
import com.khuoo.portfolio.site.domain.Technology;
import com.khuoo.portfolio.site.domain.PortfolioTechnology;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

// JPA 기반 공개 메인 페이지 목록·조합 조회 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SiteQueryRepositoryImpl implements SiteQueryRepository {

    private static final short CURRENT_RESUME_ID = 1;

    private final EntityManager entityManager;

    // 고정 Slot 생성 순서를 유지한 콘텐츠 전체 조회
    @Override
    public List<PortfolioContent> findPortfolioContents() {
        return entityManager.createQuery("""
                        SELECT content
                        FROM PortfolioContent content
                        ORDER BY content.id ASC
                        """, PortfolioContent.class)
                .getResultList();
    }

    // 공개 상태와 표시 순서를 반영한 프로필 조회
    @Override
    public List<ProfileEntry> findEnabledProfileEntries() {
        return entityManager.createQuery("""
                        SELECT entry
                        FROM ProfileEntry entry
                        WHERE entry.enabled = true
                        ORDER BY entry.displayOrder ASC, entry.id ASC
                        """, ProfileEntry.class)
                .getResultList();
    }

    // 메인 관계와 활성 기술 사전의 단일 조합 조회
    @Override
    public List<PortfolioTechnologyView> findPortfolioTechnologies() {
        return entityManager.createQuery("""
                        SELECT new com.khuoo.portfolio.site.repository.PortfolioTechnologyView(
                            technology.id,
                            technology.name,
                            technology.category,
                            technology.iconUrl,
                            mapping.displayOrder
                        )
                        FROM PortfolioTechnology mapping
                        JOIN Technology technology ON technology.id = mapping.technologyId
                        WHERE technology.enabled = true
                        ORDER BY mapping.displayOrder ASC, technology.id ASC
                        """, PortfolioTechnologyView.class)
                .getResultList();
    }

    // 공개 상태와 표시 순서를 반영한 프로젝트 조회
    @Override
    public List<Project> findEnabledProjects() {
        return entityManager.createQuery("""
                        SELECT project
                        FROM Project project
                        WHERE project.enabled = true
                        ORDER BY project.displayOrder ASC, project.id ASC
                        """, Project.class)
                .getResultList();
    }

    // 공개 프로젝트 전체의 카드 노출 기술 일괄 조회
    @Override
    public List<ProjectTechnologyView> findCardTechnologies(List<Long> projectIds) {
        if (projectIds.isEmpty()) {
            return List.of();
        }
        return entityManager.createQuery("""
                        SELECT new com.khuoo.portfolio.site.repository.ProjectTechnologyView(
                            mapping.projectId,
                            technology.id,
                            technology.name,
                            technology.category,
                            technology.iconUrl,
                            mapping.highlighted,
                            mapping.displayOrder
                        )
                        FROM ProjectTechnology mapping
                        JOIN Technology technology ON technology.id = mapping.technologyId
                        WHERE mapping.projectId IN :projectIds
                          AND mapping.showOnCard = true
                        ORDER BY mapping.projectId ASC, mapping.displayOrder ASC, technology.id ASC
                        """, ProjectTechnologyView.class)
                .setParameter("projectIds", projectIds)
                .getResultList();
    }

    // 공개 상태와 표시 순서를 반영한 외부 링크 조회
    @Override
    public List<ExternalLink> findEnabledExternalLinks() {
        return entityManager.createQuery("""
                        SELECT link
                        FROM ExternalLink link
                        WHERE link.enabled = true
                        ORDER BY link.displayOrder ASC, link.id ASC
                        """, ExternalLink.class)
                .getResultList();
    }

    // 고정 식별자 기반 현재 이력서 메타데이터 조회
    @Override
    public Optional<ResumeFile> findCurrentResume() {
        return Optional.ofNullable(entityManager.find(ResumeFile.class, CURRENT_RESUME_ID));
    }

    // 비활성 포함 표시 순서 기반 전체 프로필 조회
    @Override
    public List<ProfileEntry> findProfileEntries() {
        return entityManager.createQuery("""
                        SELECT entry
                        FROM ProfileEntry entry
                        ORDER BY entry.displayOrder ASC, entry.id ASC
                        """, ProfileEntry.class)
                .getResultList();
    }

    // 비활성 포함 식별자 기반 전체 기술 사전 조회
    @Override
    public List<Technology> findTechnologyMaster() {
        return entityManager.createQuery("""
                        SELECT technology
                        FROM Technology technology
                        ORDER BY technology.id ASC
                        """, Technology.class)
                .getResultList();
    }

    // 표시 순서 기반 현재 메인 기술 구성 조회
    @Override
    public List<PortfolioTechnology> findPortfolioTechnologyMappings() {
        return entityManager.createQuery("""
                        SELECT mapping
                        FROM PortfolioTechnology mapping
                        ORDER BY mapping.displayOrder ASC, mapping.technologyId ASC
                        """, PortfolioTechnology.class)
                .getResultList();
    }

    // 비활성 포함 표시 순서 기반 전체 외부 링크 조회
    @Override
    public List<ExternalLink> findExternalLinks() {
        return entityManager.createQuery("""
                        SELECT link
                        FROM ExternalLink link
                        ORDER BY link.displayOrder ASC, link.id ASC
                        """, ExternalLink.class)
                .getResultList();
    }
}
