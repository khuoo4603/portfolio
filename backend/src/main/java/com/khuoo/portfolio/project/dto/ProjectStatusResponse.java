package com.khuoo.portfolio.project.dto;

import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.common.util.ResponseTime;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 프로젝트 공개 상태 변경 응답
public record ProjectStatusResponse(
        @Schema(description = "프로젝트 식별자") Long id,
        @Schema(description = "프로젝트 공개 여부") boolean enabled,
        @Schema(description = "마지막 수정 시각") OffsetDateTime updatedAt
) {

    // 프로젝트 Entity의 공개 상태 응답 변환
    public static ProjectStatusResponse from(Project project) {
        return new ProjectStatusResponse(
                project.getId(),
                project.isEnabled(),
                ResponseTime.kst(project.getUpdatedAt())
        );
    }
}
