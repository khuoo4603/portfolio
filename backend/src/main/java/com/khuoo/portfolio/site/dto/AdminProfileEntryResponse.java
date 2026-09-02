package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.ResponseTime;
import com.khuoo.portfolio.common.util.PortfolioEnums.ProfileEntryType;
import com.khuoo.portfolio.site.domain.ProfileEntry;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 프로필 항목 전체 값 응답
public record AdminProfileEntryResponse(
        @Schema(description = "프로필 항목 식별자", example = "1")
        Long id,

        @Schema(description = "프로필 항목 유형", example = "EDUCATION")
        ProfileEntryType entryType,

        @Schema(description = "기간 표시 문구", nullable = true)
        String periodText,

        @Schema(description = "항목 제목")
        String title,

        @Schema(description = "소속 또는 주관 기관", nullable = true)
        String organization,

        @Schema(description = "역할 또는 담당", nullable = true)
        String role,

        @Schema(description = "주요 설명", nullable = true)
        String description,

        @Schema(description = "주요 성과", nullable = true)
        String achievement,

        @Schema(description = "표시 순서")
        int displayOrder,

        @Schema(description = "공개 활성 여부")
        boolean enabled,

        @Schema(description = "생성 시각")
        OffsetDateTime createdAt,

        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {

    // 프로필 Entity의 관리자 응답 변환
    public static AdminProfileEntryResponse from(ProfileEntry entry) {
        return new AdminProfileEntryResponse(
                entry.getId(),
                entry.getEntryType(),
                entry.getPeriodText(),
                entry.getTitle(),
                entry.getOrganization(),
                entry.getRole(),
                entry.getDescription(),
                entry.getAchievement(),
                entry.getDisplayOrder(),
                entry.isEnabled(),
                ResponseTime.kst(entry.getCreatedAt()),
                ResponseTime.kst(entry.getUpdatedAt())
        );
    }
}
