package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 공개 메인 페이지 전체 데이터 응답
public record PublicPortfolioResponse(
        @Schema(description = "고정 콘텐츠 목록")
        List<PortfolioContentResponse> portfolioContents,

        @Schema(description = "공개 프로필 항목")
        List<ProfileEntryResponse> profileEntries,

        @Schema(description = "메인 기술 스택")
        List<TechnologyResponse> portfolioTechnologies,

        @Schema(description = "공개 프로젝트 카드")
        List<ProjectCardResponse> projects,

        @Schema(description = "공개 외부 링크")
        List<ExternalLinkResponse> externalLinks,

        @Schema(description = "현재 이력서 메타데이터", nullable = true)
        ResumeMetadataResponse resume
) {
}
