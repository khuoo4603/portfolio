package com.khuoo.portfolio.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 관리자 프로젝트 편집 상세 응답
public record AdminProjectDetailResponse(
        @Schema(description = "프로젝트 기본정보") AdminProjectResponse project,
        @Schema(description = "프로젝트 전체 연결 기술") List<AdminProjectTechnologyResponse> technologies,
        @Schema(description = "프로젝트 고정 본문") ProjectContentResponse content,
        @Schema(description = "프로젝트 이미지 갤러리") List<ProjectMediaResponse> media
) {

    public AdminProjectDetailResponse {
        technologies = List.copyOf(technologies);
        media = List.copyOf(media);
    }
}
