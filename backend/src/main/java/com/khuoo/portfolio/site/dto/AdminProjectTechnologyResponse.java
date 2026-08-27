package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;
import com.khuoo.portfolio.site.repository.AdminProjectTechnologyView;
import io.swagger.v3.oas.annotations.media.Schema;

// 관리자 프로젝트 연결 기술 응답
public record AdminProjectTechnologyResponse(
        @Schema(description = "기술 식별자") Long technologyId,
        @Schema(description = "기술명") String name,
        @Schema(description = "기술 분류") TechnologyCategory category,
        @Schema(description = "기술 아이콘 경로", nullable = true) String iconUrl,
        @Schema(description = "메인 카드 노출 여부") boolean showOnCard,
        @Schema(description = "본인 개발 영역 강조 여부") boolean highlighted,
        @Schema(description = "표시 순서") int displayOrder
) {

    // 관리자 프로젝트 기술 조회 결과 변환
    public static AdminProjectTechnologyResponse from(AdminProjectTechnologyView view) {
        return new AdminProjectTechnologyResponse(
                view.technologyId(),
                view.name(),
                view.category(),
                view.iconUrl(),
                view.showOnCard(),
                view.highlighted(),
                view.displayOrder()
        );
    }
}
