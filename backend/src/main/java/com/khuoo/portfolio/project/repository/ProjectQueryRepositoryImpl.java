package com.khuoo.portfolio.project.repository;

import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.project.domain.ProjectContent;
import com.khuoo.portfolio.project.domain.ProjectMedia;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

// JPA 기반 공개 프로젝트 상세 단건·조합 조회 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectQueryRepositoryImpl implements ProjectQueryRepository {

    private final EntityManager entityManager;

    // 표시 순서와 식별자 기준 관리자 프로젝트 전체 조회
    @Override
    public List<Project> findAllProjects() {
        return entityManager.createQuery("""
                        SELECT project
                        FROM Project project
                        ORDER BY project.displayOrder ASC, project.id ASC
                        """, Project.class)
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
                        SELECT new com.khuoo.portfolio.project.repository.ProjectTechnologyView(
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

    // slug와 공개 상태를 함께 적용한 프로젝트 조회
    @Override
    public Optional<Project> findEnabledBySlug(String slug) {
        return entityManager.createQuery("""
                        SELECT project
                        FROM Project project
                        WHERE project.slug = :slug
                          AND project.enabled = true
                        """, Project.class)
                .setParameter("slug", slug)
                .getResultStream()
                .findFirst();
    }

    // showOnCard와 무관한 프로젝트 전체 기술 조회
    @Override
    public List<ProjectTechnologyView> findTechnologies(Long projectId) {
        return entityManager.createQuery("""
                        SELECT new com.khuoo.portfolio.project.repository.ProjectTechnologyView(
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
                        WHERE mapping.projectId = :projectId
                        ORDER BY mapping.displayOrder ASC, technology.id ASC
                        """, ProjectTechnologyView.class)
                .setParameter("projectId", projectId)
                .getResultList();
    }

    // 카드 노출 여부를 포함한 관리자 프로젝트 전체 기술 조회
    @Override
    public List<AdminProjectTechnologyView> findAdminTechnologies(Long projectId) {
        return entityManager.createQuery("""
                        SELECT new com.khuoo.portfolio.project.repository.AdminProjectTechnologyView(
                            technology.id,
                            technology.name,
                            technology.category,
                            technology.iconUrl,
                            mapping.showOnCard,
                            mapping.highlighted,
                            mapping.displayOrder
                        )
                        FROM ProjectTechnology mapping
                        JOIN Technology technology ON technology.id = mapping.technologyId
                        WHERE mapping.projectId = :projectId
                        ORDER BY mapping.displayOrder ASC, technology.id ASC
                        """, AdminProjectTechnologyView.class)
                .setParameter("projectId", projectId)
                .getResultList();
    }

    // 프로젝트 식별자 기반 고정 본문 조회
    @Override
    public Optional<ProjectContent> findContent(Long projectId) {
        return Optional.ofNullable(entityManager.find(ProjectContent.class, projectId));
    }

    // 프로젝트 식별자와 표시 순서 기반 미디어 조회
    @Override
    public List<ProjectMedia> findMedia(Long projectId) {
        return entityManager.createQuery("""
                        SELECT media
                        FROM ProjectMedia media
                        WHERE media.projectId = :projectId
                        ORDER BY media.displayOrder ASC, media.id ASC
                        """, ProjectMedia.class)
                .setParameter("projectId", projectId)
                .getResultList();
    }
}
