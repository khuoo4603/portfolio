package com.khuoo.portfolio.project.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

// 신규 CONTENT 업로드 임시 참조를 허용하는 고정 6개 Section 입력
public record ProjectContentSaveRequest(
        @NotNull List<@NotNull @Valid ResultItem> results,
        @NotNull List<@NotNull @Valid BackgroundItem> background,
        @NotNull List<@NotNull @Valid FeatureItem> features,
        @NotNull List<@NotNull @Valid DevelopmentItem> development,
        @NotNull @Valid Architecture architecture,
        @NotNull List<@NotNull @Valid EngineeringItem> engineering
) {

    // 프로젝트 성과 항목
    public record ResultItem(
            @NotBlank @Size(max = 300) String title,
            @NotBlank @Size(max = 5000) String description
    ) {
    }

    // 문제 배경 항목
    public record BackgroundItem(
            @Size(max = 300) String title,
            @NotBlank @Size(max = 10000) String body,
            @Positive Long mediaId,
            @Size(max = 100) @Schema(description = "신규 CONTENT 업로드 clientKey", nullable = true) String clientKey
    ) implements MediaReference {
    }

    // 주요 기능 항목
    public record FeatureItem(
            @NotBlank @Size(max = 300) String title,
            @NotBlank @Size(max = 5000) String description,
            @Positive Long mediaId,
            @Size(max = 100) @Schema(description = "신규 CONTENT 업로드 clientKey", nullable = true) String clientKey
    ) implements MediaReference {
    }

    // 직접 담당 개발 영역 항목
    public record DevelopmentItem(
            @NotBlank @Size(max = 300) String title,
            @NotNull List<@NotBlank @Size(max = 1000) String> items,
            @Positive Long mediaId,
            @Size(max = 100) @Schema(description = "신규 CONTENT 업로드 clientKey", nullable = true) String clientKey
    ) implements MediaReference {
    }

    // Frontend 고정 Layout용 아키텍처 노드 그룹
    public record Architecture(
            @NotNull List<@NotBlank @Size(max = 300) String> clients,
            @NotNull List<@NotBlank @Size(max = 300) String> services,
            @NotNull List<@NotBlank @Size(max = 300) String> dataAndExternal,
            @NotNull List<@NotBlank @Size(max = 300) String> runtime,
            @NotNull List<@NotBlank @Size(max = 300) String> delivery
    ) {
    }

    // 기술적 문제 해결 항목
    public record EngineeringItem(
            @NotBlank @Size(max = 300) String title,
            @Size(max = 1000) String summary,
            @NotBlank @Size(max = 10000) String problem,
            @NotBlank @Size(max = 10000) String solution,
            @NotBlank @Size(max = 10000) String result,
            @Positive Long mediaId,
            @Size(max = 100) @Schema(description = "신규 CONTENT 업로드 clientKey", nullable = true) String clientKey
    ) implements MediaReference {
    }

    // 기존 mediaId 또는 신규 clientKey 선택 참조
    public sealed interface MediaReference permits BackgroundItem, FeatureItem, DevelopmentItem, EngineeringItem {
        Long mediaId();

        String clientKey();
    }
}
