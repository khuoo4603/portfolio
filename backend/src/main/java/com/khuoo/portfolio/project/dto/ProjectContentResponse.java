package com.khuoo.portfolio.project.dto;

import com.fasterxml.jackson.databind.JsonNode;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.project.domain.ProjectContent;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Objects;

// 공개 프로젝트 상세의 고정 6개 본문 응답
public record ProjectContentResponse(
        @Schema(description = "프로젝트 성과 목록")
        List<ResultItem> results,

        @Schema(description = "문제 배경 항목")
        List<BackgroundItem> background,

        @Schema(description = "주요 기능 목록")
        List<FeatureItem> features,

        @Schema(description = "직접 담당 개발 영역")
        List<DevelopmentItem> development,

        @Schema(description = "아키텍처 설명")
        Architecture architecture,

        @Schema(description = "기술적 문제 해결 목록")
        List<EngineeringItem> engineering
) {

    private static final TypeReference<List<ResultItem>> RESULTS = new TypeReference<>() {
    };
    private static final TypeReference<List<BackgroundItem>> BACKGROUND = new TypeReference<>() {
    };
    private static final TypeReference<List<FeatureItem>> FEATURES = new TypeReference<>() {
    };
    private static final TypeReference<List<DevelopmentItem>> DEVELOPMENT = new TypeReference<>() {
    };
    private static final TypeReference<List<EngineeringItem>> ENGINEERING = new TypeReference<>() {
    };
    private static final TypeReference<Architecture> ARCHITECTURE = new TypeReference<>() {
    };

    public ProjectContentResponse {
        results = List.copyOf(Objects.requireNonNull(results));
        background = List.copyOf(Objects.requireNonNull(background));
        features = List.copyOf(Objects.requireNonNull(features));
        development = List.copyOf(Objects.requireNonNull(development));
        architecture = Objects.requireNonNull(architecture);
        engineering = List.copyOf(Objects.requireNonNull(engineering));
    }

    // 프로젝트 본문 미등록 상태의 기본 빈 구조
    public static ProjectContentResponse empty() {
        return new ProjectContentResponse(
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                Architecture.empty(),
                List.of()
        );
    }

    // JSONB Entity의 typed 공개 본문 변환
    public static ProjectContentResponse from(ProjectContent content, ObjectMapper objectMapper) {
        return new ProjectContentResponse(
                read(objectMapper, content.getResults(), RESULTS),
                read(objectMapper, content.getBackground(), BACKGROUND),
                read(objectMapper, content.getFeatures(), FEATURES),
                read(objectMapper, content.getDevelopment(), DEVELOPMENT),
                read(objectMapper, content.getArchitecture(), ARCHITECTURE),
                read(objectMapper, content.getEngineering(), ENGINEERING)
        );
    }

    // Hibernate JSON 값의 API 계약 타입 변환
    private static <T> T read(ObjectMapper objectMapper, JsonNode value, TypeReference<T> type) {
        try {
            return objectMapper.readValue(value.toString(), type);
        } catch (Exception exception) {
            throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR, exception);
        }
    }

    // 프로젝트 성과 항목
    public record ResultItem(
            @NotBlank @Schema(description = "성과 제목") String title,
            @Schema(description = "성과 설명", nullable = true) String description
    ) {
        public ResultItem {
            Objects.requireNonNull(title);
        }
    }

    // 프로젝트 문제 배경 항목
    public record BackgroundItem(
            @Schema(description = "선택 제목", nullable = true) String title,
            @NotBlank @Schema(description = "문제 배경 본문") String body
    ) {
        public BackgroundItem {
            Objects.requireNonNull(body);
        }
    }

    // 프로젝트 주요 기능 항목
    public record FeatureItem(
            @NotBlank @Schema(description = "기능 제목") String title,
            @Schema(description = "기능 설명", nullable = true) String description
    ) {
        public FeatureItem {
            Objects.requireNonNull(title);
        }
    }

    // 직접 담당 개발 영역 항목
    public record DevelopmentItem(
            @Schema(description = "개발 영역 제목", example = "Backend")
            @NotBlank String title,

            @Schema(description = "담당 작업 목록")
            @NotNull List<@NotBlank String> items
    ) {
        public DevelopmentItem {
            Objects.requireNonNull(title);
            items = List.copyOf(Objects.requireNonNull(items));
        }
    }

    // 아키텍처 이미지 하단 설명 그룹
    public record Architecture(
            @Schema(description = "아키텍처 설명 목록")
            List<Note> notes
    ) {
        public Architecture {
            notes = notes == null ? List.of() : List.copyOf(notes);
        }

        // 본문 미등록 상태의 빈 아키텍처 객체
        public static Architecture empty() {
            return new Architecture(List.of());
        }
    }

    // 아키텍처 운영 메모
    public record Note(
            @NotBlank @Schema(description = "설명 제목") String title,
            @NotBlank @Schema(description = "설명 본문") String body
    ) {
        public Note {
            Objects.requireNonNull(title);
            Objects.requireNonNull(body);
        }
    }

    // 기술적 문제 해결 항목
    public record EngineeringItem(
            @Schema(description = "문제 해결 제목")
            @NotBlank String title,

            @Schema(description = "문제 해결 요약")
            String summary,

            @Schema(description = "문제 상황")
            @NotBlank String problem,

            @Schema(description = "해결 방법")
            @NotBlank String solution,

            @Schema(description = "적용 결과")
            @NotBlank String result
    ) {
        public EngineeringItem {
            Objects.requireNonNull(title);
            Objects.requireNonNull(problem);
            Objects.requireNonNull(solution);
            Objects.requireNonNull(result);
        }
    }
}
