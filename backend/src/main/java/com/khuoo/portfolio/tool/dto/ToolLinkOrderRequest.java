package com.khuoo.portfolio.tool.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

// Tool Link 전체 표시 순서 일괄 변경과 동시성 기준
public record ToolLinkOrderRequest(
        @NotNull @Size(max = 200)
        @Schema(description = "변경 후 Tool Link ID 순서")
        List<@NotNull @Positive Long> orderedIds,

        @NotNull @Size(max = 200)
        @Schema(description = "저장 시작 시점 Tool Link ID 순서")
        List<@NotNull @Positive Long> expectedIds
) {
}
