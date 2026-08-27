package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 관리자 메인 기술 구성 전체 교체 결과
public record PortfolioTechnologyReplaceResponse(
        @Schema(description = "저장된 메인 기술 구성")
        List<PortfolioTechnologyMappingResponse> items
) {
}
