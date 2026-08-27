package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.site.domain.PortfolioTechnology;
import io.swagger.v3.oas.annotations.media.Schema;

// 관리자 메인 기술 구성 Mapping 응답
public record PortfolioTechnologyMappingResponse(
        @Schema(description = "기술 식별자", example = "1")
        Long technologyId,

        @Schema(description = "표시 순서", example = "1")
        int displayOrder
) {

    // 메인 기술 Mapping Entity의 응답 변환
    public static PortfolioTechnologyMappingResponse from(PortfolioTechnology mapping) {
        return new PortfolioTechnologyMappingResponse(
                mapping.getTechnologyId(),
                mapping.getDisplayOrder()
        );
    }
}
