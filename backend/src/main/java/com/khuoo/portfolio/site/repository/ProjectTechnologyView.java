package com.khuoo.portfolio.site.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;

// 프로젝트 기술 관계와 기술 사전의 일괄 조회 결과
public record ProjectTechnologyView(
        Long projectId,
        Long id,
        String name,
        TechnologyCategory category,
        String iconUrl,
        boolean highlighted,
        int displayOrder
) {
}
