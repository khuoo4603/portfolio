package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.List;

// 프로젝트 기술 구성 전체 교체 요청
public record ProjectTechnologyReplaceRequest(
        @NotNull
        @Schema(description = "새 프로젝트 기술 구성, 빈 배열은 전체 해제")
        List<@NotNull @Valid Item> items
) {

    // 프로젝트 기술 구성 항목
    public record Item(
            @NotNull @Positive @Schema(description = "활성 기술 식별자") Long technologyId,
            @NotNull @Schema(description = "메인 카드 노출 여부") Boolean showOnCard,
            @NotNull @Schema(description = "본인 개발 영역 강조 여부") Boolean highlighted,
            @NotNull @PositiveOrZero @Schema(description = "표시 순서") Integer displayOrder
    ) {
    }
}
