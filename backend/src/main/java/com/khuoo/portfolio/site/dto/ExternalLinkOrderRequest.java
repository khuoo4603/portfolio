package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

// 외부 링크 전체 일괄 순서 변경과 동시성 기준
public record ExternalLinkOrderRequest(
        @NotNull @Size(max = 200)
        @Schema(description = "변경 후 외부 링크 ID 순서")
        List<@NotNull @Positive Long> orderedIds,

        @NotNull @Size(max = 200)
        @Schema(description = "저장 시작 시점 외부 링크 ID 순서")
        List<@NotNull @Positive Long> expectedIds
) {
}
