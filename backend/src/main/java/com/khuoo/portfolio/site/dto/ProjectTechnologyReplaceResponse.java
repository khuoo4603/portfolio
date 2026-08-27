package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.site.domain.ProjectTechnology;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 프로젝트 기술 구성 전체 교체 응답
public record ProjectTechnologyReplaceResponse(
        @Schema(description = "저장된 프로젝트 기술 구성")
        List<Item> items
) {

    public ProjectTechnologyReplaceResponse {
        items = List.copyOf(items);
    }

    // 프로젝트 기술 Mapping Entity 응답 항목
    public record Item(
            @Schema(description = "기술 식별자") Long technologyId,
            @Schema(description = "메인 카드 노출 여부") boolean showOnCard,
            @Schema(description = "본인 개발 영역 강조 여부") boolean highlighted,
            @Schema(description = "표시 순서") int displayOrder
    ) {

        // 프로젝트 기술 Mapping Entity 변환
        public static Item from(ProjectTechnology mapping) {
            return new Item(
                    mapping.getTechnologyId(),
                    mapping.isShowOnCard(),
                    mapping.isHighlighted(),
                    mapping.getDisplayOrder()
            );
        }
    }
}
