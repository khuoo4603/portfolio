package com.khuoo.portfolio.project.dto;

import com.khuoo.portfolio.project.dto.ProjectContentResponse.DevelopmentItem;
import com.khuoo.portfolio.project.dto.ProjectContentResponse.EngineeringItem;
import com.khuoo.portfolio.project.dto.ProjectContentResponse.BackgroundItem;
import com.khuoo.portfolio.project.dto.ProjectContentResponse.FeatureItem;
import com.khuoo.portfolio.project.dto.ProjectContentResponse.ResultItem;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;

import java.util.List;

// 프로젝트 고정 6개 본문 전체 교체 요청
public record ProjectContentUpdateRequest(
        @NotNull
        @Schema(description = "프로젝트 성과 목록")
        List<@NotNull @Valid ResultItem> results,

        @NotNull
        @Schema(description = "문제 배경 항목")
        List<@NotNull @Valid BackgroundItem> background,

        @NotNull
        @Schema(description = "주요 기능 목록")
        List<@NotNull @Valid FeatureItem> features,

        @NotNull
        @Schema(description = "직접 담당 개발 영역")
        List<@NotNull @Valid DevelopmentItem> development,

        @NotNull
        @Valid
        @Schema(description = "아키텍처 노드 텍스트")
        ProjectContentResponse.Architecture architecture,

        @NotNull
        @Schema(description = "기술적 문제 해결 목록")
        List<@NotNull @Valid EngineeringItem> engineering
) {
}
