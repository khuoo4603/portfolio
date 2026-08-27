package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCategory;
import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCode;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.util.List;

// 관리자 고정 콘텐츠 원자적 Batch 수정 요청
public record PortfolioContentUpdateRequest(
        @NotEmpty
        @Schema(description = "수정할 고정 콘텐츠 목록")
        List<@NotNull @Valid Item> items
) {

    // 고정 콘텐츠 Slot 수정 항목
    public record Item(
            @NotNull
            @Schema(description = "콘텐츠 영역", example = "COMMON")
            PortfolioContentCategory category,

            @NotNull
            @Schema(description = "고정 콘텐츠 Slot 코드", example = "POSITION")
            PortfolioContentCode contentCode,

            @NotNull
            @Schema(description = "새 화면 표시 문구")
            String contentValue
    ) {
    }
}
