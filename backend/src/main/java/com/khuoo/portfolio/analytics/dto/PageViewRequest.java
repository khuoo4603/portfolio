package com.khuoo.portfolio.analytics.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

// 내부 페이지 방문 집계 요청
public record PageViewRequest(
        @NotNull
        @Schema(description = "익명 방문자 식별 Key", format = "uuid")
        UUID visitorKey,

        @NotBlank
        @Schema(description = "공개 페이지 경로", example = "/projects/kyvc")
        String path
) {
}
