package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 관리자 고정 콘텐츠 Batch 수정 결과
public record PortfolioContentUpdateResponse(
        @Schema(description = "수정 요청 순서의 고정 콘텐츠 결과")
        List<AdminPortfolioContentResponse> items
) {
}
