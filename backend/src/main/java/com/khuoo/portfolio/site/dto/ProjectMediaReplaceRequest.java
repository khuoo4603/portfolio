package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.util.List;

// 프로젝트 이미지 갤러리 전체 교체 요청
public record ProjectMediaReplaceRequest(
        @NotNull
        @Schema(description = "새 이미지 갤러리 구성, 빈 배열은 전체 제거")
        List<@NotNull @Valid Item> items
) {

    // 프로젝트 이미지 갤러리 항목
    public record Item(
            @NotBlank @Schema(description = "이미지 경로 또는 URL") String imageUrl,
            @Size(max = 200) @Schema(description = "관리용 Label", nullable = true) String label,
            @Size(max = 300) @Schema(description = "접근성 대체 텍스트", nullable = true) String altText,
            @NotNull @PositiveOrZero @Schema(description = "표시 순서") Integer displayOrder
    ) {
    }
}
