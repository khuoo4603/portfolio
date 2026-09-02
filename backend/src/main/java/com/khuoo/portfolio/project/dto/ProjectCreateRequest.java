package com.khuoo.portfolio.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

// 관리자 프로젝트 생성 요청
public record ProjectCreateRequest(
        @NotBlank
        @Size(max = 100)
        @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*", message = "slug 형식을 확인하세요.")
        @Schema(description = "공개 상세 Route slug", example = "kyvc")
        String slug,

        @NotBlank
        @Size(max = 200)
        @Schema(description = "프로젝트명")
        String name
) {
}
