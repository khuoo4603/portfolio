package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 관리자 사이트 초기 관리 데이터 통합 응답
public record AdminSiteResponse(
        @Schema(description = "전체 고정 콘텐츠")
        List<AdminPortfolioContentResponse> portfolioContents,

        @Schema(description = "비활성 포함 전체 프로필 항목")
        List<AdminProfileEntryResponse> profileEntries,

        @Schema(description = "비활성 포함 전체 기술 사전")
        List<TechnologyMasterResponse> technologyMaster,

        @Schema(description = "현재 메인 기술 구성")
        List<PortfolioTechnologyMappingResponse> portfolioTechnologies,

        @Schema(description = "비활성 포함 전체 외부 링크")
        List<AdminExternalLinkResponse> externalLinks,

        @Schema(description = "현재 이력서 메타데이터", nullable = true)
        ResumeMetadataResponse resume
) {
}
