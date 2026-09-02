package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.ProfileEntryType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

// 관리자 프로필 항목 생성 요청
public record ProfileEntryCreateRequest(
        @NotNull
        @Schema(description = "프로필 항목 유형", example = "EDUCATION")
        ProfileEntryType entryType,

        @Size(max = 100)
        @Schema(description = "기간 표시 문구", nullable = true)
        String periodText,

        @NotBlank
        @Size(max = 200)
        @Schema(description = "항목 제목")
        String title,

        @Size(max = 200)
        @Schema(description = "소속 또는 주관 기관", nullable = true)
        String organization,

        @Size(max = 200)
        @Schema(description = "역할 또는 담당", nullable = true)
        String role,

        @Schema(description = "주요 설명", nullable = true)
        String description,

        @Schema(description = "주요 성과", nullable = true)
        String achievement,

        @PositiveOrZero
        @Schema(description = "표시 순서", defaultValue = "0")
        Integer displayOrder,

        @Schema(description = "공개 활성 여부", defaultValue = "true")
        Boolean enabled
) {
}
