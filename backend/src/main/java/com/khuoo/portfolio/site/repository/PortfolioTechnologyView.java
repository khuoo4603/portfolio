package com.khuoo.portfolio.site.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;

// 메인 기술 관계와 기술 사전의 조합 조회 결과
public record PortfolioTechnologyView(
        Long id,
        String name,
        TechnologyCategory category,
        String iconUrl,
        int displayOrder
) {
}
