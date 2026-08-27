package com.khuoo.portfolio.site.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.databind.JsonNode;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.site.domain.ProjectContent;
import io.swagger.v3.oas.annotations.media.Schema;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Objects;

// 공개 프로젝트 상세의 고정 6개 본문 응답
public record ProjectContentResponse(
        @Schema(description = "프로젝트 성과 목록")
        List<TitleItem> results,

        @Schema(description = "문제 배경 문단 목록")
        List<String> background,

        @Schema(description = "주요 기능 목록")
        List<TitleItem> features,

        @Schema(description = "직접 담당 개발 영역")
        List<DevelopmentItem> development,

        @Schema(description = "아키텍처 노드 텍스트")
        Architecture architecture,

        @Schema(description = "기술적 문제 해결 목록")
        List<EngineeringItem> engineering
) {

    private static final TypeReference<List<TitleItem>> TITLES = new TypeReference<>() {
    };
    private static final TypeReference<List<String>> PARAGRAPHS = new TypeReference<>() {
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
                read(objectMapper, content.getResults(), TITLES),
                read(objectMapper, content.getBackground(), PARAGRAPHS),
                read(objectMapper, content.getFeatures(), TITLES),
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

    // 성과와 주요 기능의 제목 항목
    public record TitleItem(
            @Schema(description = "항목 제목")
            String title
    ) {
        public TitleItem {
            Objects.requireNonNull(title);
        }
    }

    // 직접 담당 개발 영역 항목
    public record DevelopmentItem(
            @Schema(description = "개발 영역 제목", example = "Backend")
            String title,

            @Schema(description = "담당 작업 목록")
            List<String> items
    ) {
        public DevelopmentItem {
            Objects.requireNonNull(title);
            items = List.copyOf(Objects.requireNonNull(items));
        }
    }

    // Frontend 고정 Layout에 전달할 아키텍처 노드 그룹
    @JsonInclude(JsonInclude.Include.NON_EMPTY)
    public record Architecture(
            @Schema(description = "Client 노드")
            List<String> clients,

            @Schema(description = "Service 노드")
            List<String> services,

            @Schema(description = "Data 및 외부 연동 노드")
            List<String> dataAndExternal,

            @Schema(description = "Runtime 노드")
            List<String> runtime,

            @Schema(description = "Delivery 노드")
            List<String> delivery
    ) {
        public Architecture {
            clients = clients == null ? List.of() : List.copyOf(clients);
            services = services == null ? List.of() : List.copyOf(services);
            dataAndExternal = dataAndExternal == null ? List.of() : List.copyOf(dataAndExternal);
            runtime = runtime == null ? List.of() : List.copyOf(runtime);
            delivery = delivery == null ? List.of() : List.copyOf(delivery);
        }

        // 본문 미등록 상태의 빈 아키텍처 객체
        public static Architecture empty() {
            return new Architecture(List.of(), List.of(), List.of(), List.of(), List.of());
        }
    }

    // 기술적 문제 해결 항목
    public record EngineeringItem(
            @Schema(description = "문제 해결 제목")
            String title,

            @Schema(description = "문제 해결 요약")
            String summary,

            @Schema(description = "문제 상황")
            String problem,

            @Schema(description = "해결 방법")
            String solution,

            @Schema(description = "적용 결과")
            String result
    ) {
        public EngineeringItem {
            Objects.requireNonNull(title);
            Objects.requireNonNull(summary);
            Objects.requireNonNull(problem);
            Objects.requireNonNull(solution);
            Objects.requireNonNull(result);
        }
    }
}
