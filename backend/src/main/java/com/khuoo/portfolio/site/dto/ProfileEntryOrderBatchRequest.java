package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

// 여러 프로필 그룹의 순서 변경과 공통 동시성 기준
public record ProfileEntryOrderBatchRequest(
        @NotNull @Size(max = 4)
        @Schema(description = "변경할 프로필 그룹별 순서 요청")
        List<@NotNull @Valid ProfileEntryOrderRequest> groups
) {
}
