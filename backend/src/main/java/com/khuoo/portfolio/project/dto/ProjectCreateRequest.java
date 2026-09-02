package com.khuoo.portfolio.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

// 관리자 프로젝트 생성 요청
public record ProjectCreateRequest(
        @NotBlank
        @Size(max = 100)
        @Schema(description = "공개 상세 Route slug", example = "kyvc")
        String slug,

        @NotBlank
        @Size(max = 200)
        @Schema(description = "프로젝트명")
        String name,

        @NotNull
        @Schema(description = "프로젝트 연도", example = "2026")
        Short year,

        @NotBlank
        @Size(max = 300)
        @Schema(description = "프로젝트 한 줄 설명")
        String tagline,

        @NotBlank
        @Schema(description = "프로젝트 카드 설명")
        String description,

        @NotBlank
        @Size(max = 150)
        @Schema(description = "프로젝트 카드 역할")
        String cardRole,

        @Schema(description = "상세 Hero 요약", nullable = true)
        String summary,

        @Size(max = 200)
        @Schema(description = "상세 Hero 역할", nullable = true)
        String detailRole,

        @Schema(description = "개발 시작일", nullable = true)
        LocalDate startedAt,

        @Schema(description = "개발 종료일", nullable = true)
        LocalDate endedAt,

        @Positive
        @Schema(description = "참여 인원", nullable = true)
        Short teamSize,

        @Schema(description = "대표 이미지 경로", nullable = true)
        String thumbnailUrl,

        @PositiveOrZero
        @Schema(description = "표시 순서", defaultValue = "0")
        Integer displayOrder,

        @Schema(description = "공개 활성 여부", defaultValue = "true")
        Boolean enabled
) {
}
