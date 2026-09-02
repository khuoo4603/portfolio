package com.khuoo.portfolio.project.dto;

import com.khuoo.portfolio.common.util.PortfolioEnums.ProjectMediaType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;
import java.util.List;

// 프로젝트 Editor 전체 Draft와 파일 변경 지시
public record ProjectSaveMetadata(
        @NotNull @Valid
        @Schema(description = "프로젝트 기본정보")
        ProjectFields project,

        @NotNull @Valid
        @Schema(description = "고정 6개 Section 본문")
        ProjectContentSaveRequest content,

        @NotNull
        @Schema(description = "저장 후 프로젝트 기술 전체 구성")
        List<@NotNull @Valid TechnologyItem> technologies,

        @NotNull
        @Schema(description = "Thumbnail 처리 방식")
        ThumbnailMode thumbnailMode,

        @NotNull
        @Schema(description = "기존·신규 미디어 변경 목록")
        List<@NotNull @Valid MediaChange> mediaChanges
) {

    // 프로젝트 기본정보 Draft
    public record ProjectFields(
            @NotBlank @Size(max = 100)
            @Pattern(regexp = "[a-z0-9]+(?:-[a-z0-9]+)*")
            @Schema(description = "공개 상세 Route slug")
            String slug,

            @NotBlank @Size(max = 200)
            @Schema(description = "프로젝트명")
            String name,

            @Min(1900) @Max(2100)
            @Schema(description = "프로젝트 연도", nullable = true)
            Short year,

            @Size(max = 300)
            @Schema(description = "메인 카드 한 줄 설명", nullable = true)
            String tagline,

            @Size(max = 5000)
            @Schema(description = "메인 카드 설명", nullable = true)
            String description,

            @Size(max = 150)
            @Schema(description = "메인 카드 역할", nullable = true)
            String cardRole,

            @Size(max = 5000)
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

            @PositiveOrZero
            @Schema(description = "메인 표시 순서")
            int displayOrder
    ) {
    }

    // 프로젝트 기술 연결 최종 항목
    public record TechnologyItem(
            @NotNull @Positive Long technologyId,
            @NotNull Boolean showOnCard,
            @NotNull Boolean highlighted,
            @NotNull @PositiveOrZero Integer displayOrder
    ) {
    }

    // 기존·신규 미디어 변경 지시
    public record MediaChange(
            @Positive @Schema(description = "기존 미디어 ID", nullable = true) Long id,
            @Size(max = 100) @Schema(description = "신규 업로드 임시 식별자", nullable = true) String clientKey,
            @NotNull @Schema(description = "미디어 처리 방식") MediaAction action,
            @PositiveOrZero @Schema(description = "mediaFiles 배열 인덱스", nullable = true) Integer uploadIndex,
            @Schema(description = "미디어 용도", nullable = true) ProjectMediaType mediaType,
            @Size(max = 200) @Schema(description = "관리용 Label", nullable = true) String label,
            @Size(max = 300) @Schema(description = "접근성 대체 텍스트", nullable = true) String altText,
            @PositiveOrZero @Schema(description = "표시 순서", nullable = true) Integer displayOrder
    ) {
    }

    // Thumbnail 파일 처리 방식
    public enum ThumbnailMode {
        KEEP,
        REMOVE,
        UPLOAD
    }

    // Project Media 변경 방식
    public enum MediaAction {
        KEEP,
        DELETE,
        UPLOAD
    }
}
