package com.khuoo.portfolio.project.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

// Project Editor 고정 6개 Section 입력
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
            @Size(max = 5000) String description
    ) {
    }

    // 문제 배경 항목
    public record BackgroundItem(
            @Size(max = 300) String title,
            @NotBlank @Size(max = 10000) String body
    ) {
    }

    // 주요 기능 항목
    public record FeatureItem(
            @NotBlank @Size(max = 300) String title,
            @Size(max = 5000) String description
    ) {
    }

    // 직접 담당 개발 영역 항목
    public record DevelopmentItem(
            @NotBlank @Size(max = 300) String title,
            @NotNull List<@NotBlank @Size(max = 1000) String> items
    ) {
    }

    // 아키텍처 이미지 하단 설명 항목
    public record Architecture(
            @NotNull List<@NotNull @Valid Note> notes
    ) {
    }

    // 아키텍처 운영 메모
    public record Note(
            @NotBlank @Size(max = 300) String title,
            @NotBlank @Size(max = 5000) String body
    ) {
    }

    // 기술적 문제 해결 항목
    public record EngineeringItem(
            @NotBlank @Size(max = 300) String title,
            @Size(max = 1000) String summary,
            @NotBlank @Size(max = 10000) String problem,
            @NotBlank @Size(max = 10000) String solution,
            @NotBlank @Size(max = 10000) String result
    ) {
    }
}
