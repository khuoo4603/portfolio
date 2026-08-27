package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCategory;
import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCode;
import com.khuoo.portfolio.site.domain.PortfolioContent;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 고정 콘텐츠 전체 값 응답
public record AdminPortfolioContentResponse(
        @Schema(description = "콘텐츠 영역", example = "COMMON")
        PortfolioContentCategory category,

        @Schema(description = "고정 콘텐츠 Slot 코드", example = "POSITION")
        PortfolioContentCode contentCode,

        @Schema(description = "화면 표시 문구")
        String contentValue,

        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {

    // 콘텐츠 Entity의 관리자 응답 변환
    public static AdminPortfolioContentResponse from(PortfolioContent content) {
        return new AdminPortfolioContentResponse(
                content.getCategory(),
                content.getContentCode(),
                content.getContentValue(),
                ResponseTime.kst(content.getUpdatedAt())
        );
    }
}
