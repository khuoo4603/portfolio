package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCategory;
import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCode;
import com.khuoo.portfolio.site.domain.PortfolioContent;
import io.swagger.v3.oas.annotations.media.Schema;

// 공개 포트폴리오 고정 콘텐츠 응답
public record PortfolioContentResponse(
        @Schema(description = "콘텐츠 영역", example = "COMMON")
        PortfolioContentCategory category,

        @Schema(description = "고정 콘텐츠 Slot 코드", example = "POSITION")
        PortfolioContentCode contentCode,

        @Schema(description = "화면 표시 문구", example = "BACKEND / INFRA DEVELOPER")
        String contentValue
) {

    // 콘텐츠 Entity의 공개 응답 변환
    public static PortfolioContentResponse from(PortfolioContent content) {
        return new PortfolioContentResponse(
                content.getCategory(),
                content.getContentCode(),
                content.getContentValue()
        );
    }
}
