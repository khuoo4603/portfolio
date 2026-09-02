package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.ProfileEntryType;
import com.khuoo.portfolio.site.domain.ProfileEntry;
import io.swagger.v3.oas.annotations.media.Schema;

// 공개 학력·경력·성과 항목 응답
public record ProfileEntryResponse(
        @Schema(description = "프로필 항목 식별자", example = "1")
        Long id,

        @Schema(description = "프로필 항목 유형", example = "EDUCATION")
        ProfileEntryType entryType,

        @Schema(description = "기간 표시 문구", example = "2023.03 — 현재", nullable = true)
        String periodText,

        @Schema(description = "항목 제목", example = "소프트웨어융합전공")
        String title,

        @Schema(description = "소속 또는 주관 기관", example = "성공회대학교", nullable = true)
        String organization,

        @Schema(description = "역할 또는 담당", example = "Backend Developer", nullable = true)
        String role,

        @Schema(description = "주요 설명", nullable = true)
        String description,

        @Schema(description = "주요 성과", nullable = true)
        String achievement,

        @Schema(description = "표시 순서", example = "1")
        int displayOrder
) {

    // 프로필 Entity의 공개 응답 변환
    public static ProfileEntryResponse from(ProfileEntry entry) {
        return new ProfileEntryResponse(
                entry.getId(),
                entry.getEntryType(),
                entry.getPeriodText(),
                entry.getTitle(),
                entry.getOrganization(),
                entry.getRole(),
                entry.getDescription(),
                entry.getAchievement(),
                entry.getDisplayOrder()
        );
    }
}
