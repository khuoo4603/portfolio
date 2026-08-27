package com.khuoo.portfolio.site.repository;

import com.khuoo.portfolio.site.domain.Project;
import com.khuoo.portfolio.site.domain.ProjectContent;
import com.khuoo.portfolio.site.domain.ProjectMedia;

import java.util.List;
import java.util.Optional;

// 공개 프로젝트 상세의 단건·조합 조회 경계
public interface ProjectQueryRepository {

    // slug와 공개 상태 기준 프로젝트 조회
    Optional<Project> findEnabledBySlug(String slug);

    // 프로젝트 전체 연결 기술 조회
    List<ProjectTechnologyView> findTechnologies(Long projectId);

    // 관리자 프로젝트 전체 연결 기술 조회
    List<AdminProjectTechnologyView> findAdminTechnologies(Long projectId);

    // 프로젝트 고정 본문 조회
    Optional<ProjectContent> findContent(Long projectId);

    // 프로젝트 이미지 갤러리 조회
    List<ProjectMedia> findMedia(Long projectId);
}
