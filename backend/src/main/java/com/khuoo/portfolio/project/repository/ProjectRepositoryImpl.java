package com.khuoo.portfolio.project.repository;

import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.project.domain.ProjectContent;
import com.khuoo.portfolio.project.domain.ProjectMedia;
import com.khuoo.portfolio.project.domain.ProjectTechnology;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

// JPA 기반 프로젝트 단건 저장·변경 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProjectRepositoryImpl implements ProjectRepository {

    private final EntityManager entityManager;

    // 프로젝트 식별자 조회
    @Override
    public Optional<Project> findProject(Long projectId) {
        return Optional.ofNullable(entityManager.find(Project.class, projectId));
    }

    // 프로젝트 slug 조회
    @Override
    public Optional<Project> findBySlug(String slug) {
        return entityManager.createQuery("""
                        SELECT project
                        FROM Project project
                        WHERE project.slug = :slug
                        """, Project.class)
                .setParameter("slug", slug)
                .getResultStream()
                .findFirst();
    }

    // 제외 식별자 이외 동일 slug 존재 여부 조회
    @Override
    public boolean existsSlug(String slug, Long excludedId) {
        if (excludedId == null) {
            return entityManager.createQuery("""
                            SELECT COUNT(project)
                            FROM Project project
                            WHERE project.slug = :slug
                            """, Long.class)
                    .setParameter("slug", slug)
                    .getSingleResult() > 0;
        }
        return entityManager.createQuery("""
                        SELECT COUNT(project)
                        FROM Project project
                        WHERE project.slug = :slug
                          AND project.id <> :excludedId
                        """, Long.class)
                .setParameter("slug", slug)
                .setParameter("excludedId", excludedId)
                .getSingleResult() > 0;
    }

    // 신규 프로젝트 저장과 DB 생성시각 재조회
    @Override
    @Transactional
    public Project saveProject(Project project) {
        entityManager.persist(project);
        entityManager.flush();
        entityManager.refresh(project);
        return project;
    }

    // 프로젝트 삭제
    @Override
    @Transactional
    public void deleteProject(Project project) {
        entityManager.remove(project);
    }

    // 신규 또는 기존 프로젝트 본문 저장과 DB 시각 재조회
    @Override
    @Transactional
    public ProjectContent saveContent(ProjectContent content) {
        if (!entityManager.contains(content)) {
            entityManager.persist(content);
        }
        entityManager.flush();
        entityManager.refresh(content);
        return content;
    }

    // 기존 연결 삭제 후 새 프로젝트 기술 구성 저장
    @Override
    @Transactional
    public void replaceTechnologies(Long projectId, List<ProjectTechnology> mappings) {
        entityManager.createQuery("""
                        DELETE FROM ProjectTechnology mapping
                        WHERE mapping.projectId = :projectId
                        """)
                .setParameter("projectId", projectId)
                .executeUpdate();
        mappings.forEach(entityManager::persist);
        entityManager.flush();
    }

    // 기존 갤러리 삭제 후 새 프로젝트 미디어 저장
    @Override
    @Transactional
    public List<ProjectMedia> saveMedia(List<ProjectMedia> media) {
        media.forEach(entityManager::persist);
        entityManager.flush();
        return media;
    }

    // 지정 프로젝트 미디어 삭제
    @Override
    @Transactional
    public void deleteMedia(List<ProjectMedia> media) {
        media.forEach(entityManager::remove);
    }

    // 현재 Transaction 변경 SQL 즉시 반영
    @Override
    @Transactional
    public void flush() {
        entityManager.flush();
    }
}
