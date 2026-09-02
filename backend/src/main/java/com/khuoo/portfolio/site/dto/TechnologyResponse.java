package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;
import com.khuoo.portfolio.site.repository.PortfolioTechnologyView;
import com.khuoo.portfolio.project.repository.ProjectTechnologyView;
import io.swagger.v3.oas.annotations.media.Schema;

// 공개 포트폴리오와 프로젝트 카드 기술 응답
public record TechnologyResponse(
        @Schema(description = "기술 식별자", example = "1")
        Long id,

        @Schema(description = "기술명", example = "Java")
        String name,

        @Schema(description = "기술 분류", example = "LANGUAGE")
        TechnologyCategory category,

        @Schema(description = "기술 아이콘 경로", example = "/icons/tech/java.svg", nullable = true)
        String iconUrl,

        @Schema(description = "표시 순서", example = "1")
        int displayOrder
) {

    // 메인 기술 조회 결과 변환
    public static TechnologyResponse from(PortfolioTechnologyView technology) {
        return new TechnologyResponse(
                technology.id(),
                technology.name(),
                technology.category(),
                technology.iconUrl(),
                technology.displayOrder()
        );
    }

    // 프로젝트 카드 기술 조회 결과 변환
    public static TechnologyResponse from(ProjectTechnologyView technology) {
        return new TechnologyResponse(
                technology.id(),
                technology.name(),
                technology.category(),
                technology.iconUrl(),
                technology.displayOrder()
        );
    }
}
