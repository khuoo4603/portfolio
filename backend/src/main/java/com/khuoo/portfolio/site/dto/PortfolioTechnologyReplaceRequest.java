package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

// 관리자 메인 기술 구성 전체 교체 요청
public record PortfolioTechnologyReplaceRequest(
        @NotNull
        @Schema(description = "새 메인 기술 구성, 빈 배열은 전체 해제")
        List<@NotNull @Valid Item> items
) {

    // 메인 기술 구성 항목
    public record Item(
            @NotNull
            @Positive
            @Schema(description = "활성 기술 식별자", example = "1")
            Long technologyId,

            @NotNull
            @PositiveOrZero
            @Schema(description = "표시 순서", example = "1")
            Integer displayOrder
    ) {
    }
}
