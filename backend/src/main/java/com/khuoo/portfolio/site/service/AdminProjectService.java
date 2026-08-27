package com.khuoo.portfolio.site.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.site.domain.Project;
import com.khuoo.portfolio.site.domain.ProjectContent;
import com.khuoo.portfolio.site.domain.ProjectMedia;
import com.khuoo.portfolio.site.domain.ProjectTechnology;
import com.khuoo.portfolio.site.domain.Technology;
import com.khuoo.portfolio.site.dto.AdminProjectDetailResponse;
import com.khuoo.portfolio.site.dto.AdminProjectResponse;
import com.khuoo.portfolio.site.dto.AdminProjectTechnologyResponse;
import com.khuoo.portfolio.site.dto.ProjectContentResponse;
import com.khuoo.portfolio.site.dto.ProjectContentUpdateRequest;
import com.khuoo.portfolio.site.dto.ProjectContentUpdateResponse;
import com.khuoo.portfolio.site.dto.ProjectCreateRequest;
import com.khuoo.portfolio.site.dto.ProjectCreateResponse;
import com.khuoo.portfolio.site.dto.ProjectMediaReplaceRequest;
import com.khuoo.portfolio.site.dto.ProjectMediaReplaceResponse;
import com.khuoo.portfolio.site.dto.ProjectMediaResponse;
import com.khuoo.portfolio.site.dto.ProjectStatusRequest;
import com.khuoo.portfolio.site.dto.ProjectStatusResponse;
import com.khuoo.portfolio.site.dto.ProjectTechnologyReplaceRequest;
import com.khuoo.portfolio.site.dto.ProjectTechnologyReplaceResponse;
import com.khuoo.portfolio.site.dto.ProjectUpdateRequest;
import com.khuoo.portfolio.site.repository.ProjectQueryRepository;
import com.khuoo.portfolio.site.repository.ProjectRepository;
import com.khuoo.portfolio.site.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.ObjectMapper;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// 관리자 프로젝트 기본정보와 상세 구성 관리
@Service
@RequiredArgsConstructor
public class AdminProjectService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");
    private static final com.fasterxml.jackson.databind.ObjectMapper CONTENT_MAPPER =
            new com.fasterxml.jackson.databind.ObjectMapper();

    private final ProjectRepository projectRepository;
    private final ProjectQueryRepository projectQueryRepository;
    private final SiteRepository siteRepository;
    private final AdminActionVerifier adminActionVerifier;
    private final ObjectMapper objectMapper;

    // 프로젝트 요청값·slug 중복 검증과 재인증 후 생성
    @Transactional(noRollbackFor = ApiException.class)
    public ProjectCreateResponse create(
            ProjectCreateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        validateSlug(request.slug());
        if (projectRepository.existsSlug(request.slug(), null)) {
            throw new ApiException(ErrorCode.PROJECT_SLUG_CONFLICT);
        }
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_CREATE,
                AdminActionTarget.PROJECT,
                null
        );

        Project project = Project.create(
                request.slug(),
                request.name(),
                request.year(),
                request.tagline(),
                request.description(),
                request.cardRole(),
                request.summary(),
                request.detailRole(),
                request.startedAt(),
                request.endedAt(),
                request.teamSize(),
                request.thumbnailUrl(),
                request.displayOrder() == null ? 0 : request.displayOrder(),
                request.enabled() == null || request.enabled()
        );
        return ProjectCreateResponse.from(projectRepository.saveProject(project));
    }

    // 비공개 상태를 포함한 관리자 프로젝트 편집 상세 조회
    @Transactional(readOnly = true)
    public AdminProjectDetailResponse find(Long projectId) {
        Project project = requireProject(projectId);
        return new AdminProjectDetailResponse(
                AdminProjectResponse.from(project),
                projectQueryRepository.findAdminTechnologies(projectId).stream()
                        .map(AdminProjectTechnologyResponse::from)
                        .toList(),
                projectQueryRepository.findContent(projectId)
                        .map(content -> ProjectContentResponse.from(content, objectMapper))
                        .orElseGet(ProjectContentResponse::empty),
                projectQueryRepository.findMedia(projectId).stream()
                        .map(ProjectMediaResponse::from)
                        .toList()
        );
    }

    // 대상과 PATCH 값을 검증한 뒤 재인증 후 프로젝트 기본정보 수정
    @Transactional(noRollbackFor = ApiException.class)
    public AdminProjectResponse update(
            Long projectId,
            ProjectUpdateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        Project project = requireProject(projectId);
        PatchValues.requireAny(
                request.slug(),
                request.name(),
                request.year(),
                request.tagline(),
                request.description(),
                request.cardRole(),
                request.summary(),
                request.detailRole(),
                request.startedAt(),
                request.endedAt(),
                request.teamSize(),
                request.thumbnailUrl(),
                request.displayOrder()
        );
        String slug = PatchValues.present(request.slug())
                ? PatchValues.requiredString(request.slug(), 100)
                : project.getSlug();
        String name = PatchValues.present(request.name())
                ? PatchValues.requiredString(request.name(), 200)
                : project.getName();
        short year = PatchValues.present(request.year())
                ? PatchValues.shortValue(request.year())
                : project.getYear();
        String tagline = PatchValues.present(request.tagline())
                ? PatchValues.requiredString(request.tagline(), 300)
                : project.getTagline();
        String description = PatchValues.present(request.description())
                ? PatchValues.requiredString(request.description(), -1)
                : project.getDescription();
        String cardRole = PatchValues.present(request.cardRole())
                ? PatchValues.requiredString(request.cardRole(), 150)
                : project.getCardRole();
        String summary = PatchValues.present(request.summary())
                ? PatchValues.nullableString(request.summary(), -1)
                : project.getSummary();
        String detailRole = PatchValues.present(request.detailRole())
                ? PatchValues.nullableString(request.detailRole(), 200)
                : project.getDetailRole();
        LocalDate startedAt = PatchValues.present(request.startedAt())
                ? PatchValues.nullableDate(request.startedAt())
                : project.getStartedAt();
        LocalDate endedAt = PatchValues.present(request.endedAt())
                ? PatchValues.nullableDate(request.endedAt())
                : project.getEndedAt();
        Short teamSize = PatchValues.present(request.teamSize())
                ? PatchValues.nullablePositiveShort(request.teamSize())
                : project.getTeamSize();
        String thumbnailUrl = PatchValues.present(request.thumbnailUrl())
                ? PatchValues.nullableString(request.thumbnailUrl(), -1)
                : project.getThumbnailUrl();
        int displayOrder = PatchValues.present(request.displayOrder())
                ? PatchValues.nonNegativeInt(request.displayOrder())
                : project.getDisplayOrder();

        validateSlug(slug);
        if (projectRepository.existsSlug(slug, projectId)) {
            throw new ApiException(ErrorCode.PROJECT_SLUG_CONFLICT);
        }
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_UPDATE,
                AdminActionTarget.PROJECT,
                projectId.toString()
        );
        project.update(
                slug,
                name,
                year,
                tagline,
                description,
                cardRole,
                summary,
                detailRole,
                startedAt,
                endedAt,
                teamSize,
                thumbnailUrl,
                displayOrder,
                now()
        );
        projectRepository.flush();
        return AdminProjectResponse.from(project);
    }

    // 대상 존재와 재인증 확인 후 프로젝트 공개 상태 변경
    @Transactional(noRollbackFor = ApiException.class)
    public ProjectStatusResponse changeStatus(
            Long projectId,
            ProjectStatusRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        Project project = requireProject(projectId);
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_STATUS_UPDATE,
                AdminActionTarget.PROJECT,
                projectId.toString()
        );
        project.changeStatus(request.enabled(), now());
        projectRepository.flush();
        return ProjectStatusResponse.from(project);
    }

    // 대상 존재와 재인증 확인 후 프로젝트 삭제
    @Transactional(noRollbackFor = ApiException.class)
    public void delete(Long projectId, AccountPrincipal currentAdmin, UUID challengeId, String code) {
        Project project = requireProject(projectId);
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_DELETE,
                AdminActionTarget.PROJECT,
                projectId.toString()
        );
        projectRepository.deleteProject(project);
    }

    // 고정 6개 Section 검증과 재인증 후 프로젝트 본문 전체 교체
    @Transactional(noRollbackFor = ApiException.class)
    public ProjectContentUpdateResponse replaceContent(
            Long projectId,
            ProjectContentUpdateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        requireProject(projectId);
        JsonNode results = json(request.results());
        JsonNode background = json(request.background());
        JsonNode features = json(request.features());
        JsonNode development = json(request.development());
        JsonNode architecture = json(request.architecture());
        JsonNode engineering = json(request.engineering());
        ProjectContent content = projectQueryRepository.findContent(projectId).orElse(null);

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_UPDATE,
                AdminActionTarget.PROJECT,
                projectId.toString()
        );
        if (content == null) {
            content = ProjectContent.create(
                    projectId,
                    results,
                    background,
                    features,
                    development,
                    architecture,
                    engineering
            );
        } else {
            content.replace(
                    results,
                    background,
                    features,
                    development,
                    architecture,
                    engineering,
                    now()
            );
        }
        return ProjectContentUpdateResponse.from(projectRepository.saveContent(content), objectMapper);
    }

    // 활성 기술 전체 검증과 재인증 후 프로젝트 기술 구성 전체 교체
    @Transactional(noRollbackFor = ApiException.class)
    public ProjectTechnologyReplaceResponse replaceTechnologies(
            Long projectId,
            ProjectTechnologyReplaceRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        requireProject(projectId);
        Set<Long> technologyIds = new LinkedHashSet<>();
        for (ProjectTechnologyReplaceRequest.Item item : request.items()) {
            if (!technologyIds.add(item.technologyId())) {
                throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
            }
        }
        Map<Long, Technology> technologyById = siteRepository.findTechnologies(technologyIds).stream()
                .collect(Collectors.toMap(Technology::getId, Function.identity()));
        for (Long technologyId : technologyIds) {
            Technology technology = technologyById.get(technologyId);
            if (technology == null || !technology.isEnabled()) {
                throw new ApiException(ErrorCode.TECHNOLOGY_NOT_FOUND);
            }
        }

        List<ProjectTechnology> mappings = request.items().stream()
                .map(item -> ProjectTechnology.create(
                        projectId,
                        item.technologyId(),
                        item.showOnCard(),
                        item.highlighted(),
                        item.displayOrder()
                ))
                .sorted(Comparator.comparingInt(ProjectTechnology::getDisplayOrder)
                        .thenComparing(ProjectTechnology::getTechnologyId))
                .toList();
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_UPDATE,
                AdminActionTarget.PROJECT,
                projectId.toString()
        );
        projectRepository.replaceTechnologies(projectId, mappings);
        return new ProjectTechnologyReplaceResponse(
                mappings.stream().map(ProjectTechnologyReplaceResponse.Item::from).toList()
        );
    }

    // 이미지 항목 전체 검증과 재인증 후 프로젝트 갤러리 전체 교체
    @Transactional(noRollbackFor = ApiException.class)
    public ProjectMediaReplaceResponse replaceMedia(
            Long projectId,
            ProjectMediaReplaceRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        requireProject(projectId);
        List<ProjectMedia> media = request.items().stream()
                .map(item -> ProjectMedia.create(
                        projectId,
                        item.imageUrl(),
                        item.label(),
                        item.altText(),
                        item.displayOrder()
                ))
                .sorted(Comparator.comparingInt(ProjectMedia::getDisplayOrder))
                .toList();
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_UPDATE,
                AdminActionTarget.PROJECT,
                projectId.toString()
        );
        List<ProjectMedia> saved = projectRepository.replaceMedia(projectId, media);
        return new ProjectMediaReplaceResponse(saved.stream().map(ProjectMediaResponse::from).toList());
    }

    private Project requireProject(Long projectId) {
        return projectRepository.findProject(projectId)
                .orElseThrow(() -> new ApiException(ErrorCode.PROJECT_NOT_FOUND));
    }

    private void validateSlug(String slug) {
        boolean routeUnsafe = slug == null
                || slug.isBlank()
                || slug.length() > 100
                || slug.chars().anyMatch(Character::isWhitespace)
                || slug.indexOf('/') >= 0
                || slug.indexOf('?') >= 0
                || slug.indexOf('#') >= 0;
        if (routeUnsafe) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
    }

    private JsonNode json(Object value) {
        try {
            return CONTENT_MAPPER.valueToTree(value);
        } catch (IllegalArgumentException exception) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR, exception);
        }
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
