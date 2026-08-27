package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 프로젝트 이미지 갤러리 전체 교체 응답
public record ProjectMediaReplaceResponse(
        @Schema(description = "저장된 프로젝트 이미지 갤러리")
        List<ProjectMediaResponse> items
) {

    public ProjectMediaReplaceResponse {
        items = List.copyOf(items);
    }
}
