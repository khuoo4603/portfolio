package com.khuoo.portfolio.project.repository;

import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.project.domain.ProjectContent;
import com.khuoo.portfolio.project.domain.ProjectMedia;
import com.khuoo.portfolio.project.domain.ProjectTechnology;

import java.util.List;
import java.util.Optional;

// 프로젝트 단건 저장·변경 Repository 경계
public interface ProjectRepository {

    // 프로젝트 식별자 조회
    Optional<Project> findProject(Long projectId);

    // 프로젝트 slug 조회
    Optional<Project> findBySlug(String slug);

    // 제외 식별자 이외 동일 slug 존재 여부 조회
    boolean existsSlug(String slug, Long excludedId);

    // 신규 프로젝트 저장
    Project saveProject(Project project);

    // 프로젝트 삭제
    void deleteProject(Project project);

    // 프로젝트 본문 저장
    ProjectContent saveContent(ProjectContent content);

    // 프로젝트 기술 구성 전체 교체
    void replaceTechnologies(Long projectId, List<ProjectTechnology> mappings);

    // 프로젝트 이미지 갤러리 전체 교체
    List<ProjectMedia> replaceMedia(Long projectId, List<ProjectMedia> media);

    // 변경 SQL 즉시 반영
    void flush();
}
