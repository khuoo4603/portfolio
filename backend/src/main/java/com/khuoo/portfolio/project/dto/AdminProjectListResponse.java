package com.khuoo.portfolio.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 관리자 프로젝트 편집 진입용 전체 목록 응답
public record AdminProjectListResponse(
        @Schema(description = "프로젝트 요약 목록") List<AdminProjectSummaryResponse> items
) {

    public AdminProjectListResponse {
        items = List.copyOf(items);
    }
}
