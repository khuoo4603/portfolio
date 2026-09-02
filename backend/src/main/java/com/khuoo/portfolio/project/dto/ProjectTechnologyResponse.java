package com.khuoo.portfolio.project.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;
import com.khuoo.portfolio.project.repository.ProjectTechnologyView;
import io.swagger.v3.oas.annotations.media.Schema;

// 공개 프로젝트 상세의 전체 기술 응답
public record ProjectTechnologyResponse(
        @Schema(description = "기술 식별자", example = "1")
        Long id,

        @Schema(description = "기술명", example = "Java")
        String name,

        @Schema(description = "기술 분류", example = "LANGUAGE")
        TechnologyCategory category,

        @Schema(description = "기술 아이콘 경로", example = "/icons/tech/java.svg", nullable = true)
        String iconUrl,

        @Schema(description = "본인 개발 영역 강조 여부", example = "true")
        boolean highlighted,

        @Schema(description = "표시 순서", example = "1")
        int displayOrder
) {

    // 프로젝트 기술 조회 결과의 상세 응답 변환
    public static ProjectTechnologyResponse from(ProjectTechnologyView technology) {
        return new ProjectTechnologyResponse(
                technology.id(),
                technology.name(),
                technology.category(),
                technology.iconUrl(),
                technology.highlighted(),
                technology.displayOrder()
        );
    }
}
