package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.ResponseTime;
import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;
import com.khuoo.portfolio.site.domain.Technology;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 기술 사전 전체 값 응답
public record TechnologyMasterResponse(
        @Schema(description = "기술 식별자", example = "1")
        Long id,

        @Schema(description = "기술명", example = "Spring Boot")
        String name,

        @Schema(description = "기술 분류", example = "BACKEND")
        TechnologyCategory category,

        @Schema(description = "기술 아이콘 경로", nullable = true)
        String iconUrl,

        @Schema(description = "신규 연결 가능 여부")
        boolean enabled,

        @Schema(description = "생성 시각")
        OffsetDateTime createdAt,

        @Schema(description = "마지막 수정 시각")
        OffsetDateTime updatedAt
) {

    // 기술 Entity의 관리자 응답 변환
    public static TechnologyMasterResponse from(Technology technology) {
        return new TechnologyMasterResponse(
                technology.getId(),
                technology.getName(),
                technology.getCategory(),
                technology.getIconUrl(),
                technology.isEnabled(),
                ResponseTime.kst(technology.getCreatedAt()),
                ResponseTime.kst(technology.getUpdatedAt())
        );
    }
}
