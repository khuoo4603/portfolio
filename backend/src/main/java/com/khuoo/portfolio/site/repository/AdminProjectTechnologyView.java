package com.khuoo.portfolio.site.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;

// 관리자 프로젝트 기술 관계와 기술 사전 조회 결과
public record AdminProjectTechnologyView(
        Long technologyId,
        String name,
        TechnologyCategory category,
        String iconUrl,
        boolean showOnCard,
        boolean highlighted,
        int displayOrder
) {
}
