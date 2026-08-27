package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

// 프로젝트 공개 상태 변경 요청
public record ProjectStatusRequest(
        @NotNull
        @Schema(description = "프로젝트 공개 여부")
        Boolean enabled
) {
}
