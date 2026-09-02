package com.khuoo.portfolio.project.repository;

import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.project.domain.ProjectContent;
import com.khuoo.portfolio.project.domain.ProjectMedia;

import java.util.List;
import java.util.Optional;

// 공개 프로젝트 상세의 단건·조합 조회 경계
public interface ProjectQueryRepository {

    // 공개 상태 프로젝트 카드 기본정보 조회
    List<Project> findEnabledProjects();

    // 프로젝트 목록 전체의 카드 노출 기술 일괄 조회
    List<ProjectTechnologyView> findCardTechnologies(List<Long> projectIds);

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
