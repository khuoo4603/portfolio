package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.site.domain.ProjectContent;
import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.databind.ObjectMapper;

import java.time.OffsetDateTime;
import java.util.List;

// 프로젝트 고정 본문 저장 응답
public record ProjectContentUpdateResponse(
        @Schema(description = "프로젝트 성과 목록") List<ProjectContentResponse.TitleItem> results,
        @Schema(description = "문제 배경 문단 목록") List<String> background,
        @Schema(description = "주요 기능 목록") List<ProjectContentResponse.TitleItem> features,
        @Schema(description = "직접 담당 개발 영역") List<ProjectContentResponse.DevelopmentItem> development,
        @Schema(description = "아키텍처 노드 텍스트") ProjectContentResponse.Architecture architecture,
        @Schema(description = "기술적 문제 해결 목록") List<ProjectContentResponse.EngineeringItem> engineering,
        @Schema(description = "마지막 수정 시각") OffsetDateTime updatedAt
) {

    // JSONB Entity의 typed 관리자 본문 응답 변환
    public static ProjectContentUpdateResponse from(ProjectContent content, ObjectMapper objectMapper) {
        ProjectContentResponse value = ProjectContentResponse.from(content, objectMapper);
        return new ProjectContentUpdateResponse(
                value.results(),
                value.background(),
                value.features(),
                value.development(),
                value.architecture(),
                value.engineering(),
                ResponseTime.kst(content.getUpdatedAt())
        );
    }
}
