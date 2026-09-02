package com.khuoo.portfolio.project.service;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.error.FieldErrorResponse;
import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.file.service.FileStorageService;
import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.project.domain.ProjectContent;
import com.khuoo.portfolio.project.domain.ProjectMedia;
import com.khuoo.portfolio.project.dto.AdminProjectDetailResponse;
import com.khuoo.portfolio.project.dto.AdminProjectListResponse;
import com.khuoo.portfolio.project.dto.AdminProjectResponse;
import com.khuoo.portfolio.project.dto.AdminProjectSummaryResponse;
import com.khuoo.portfolio.project.dto.AdminProjectTechnologyResponse;
import com.khuoo.portfolio.project.dto.ProjectContentResponse;
import com.khuoo.portfolio.project.dto.ProjectCreateRequest;
import com.khuoo.portfolio.project.dto.ProjectCreateResponse;
import com.khuoo.portfolio.project.dto.ProjectMediaResponse;
import com.khuoo.portfolio.project.dto.ProjectStatusRequest;
import com.khuoo.portfolio.project.dto.ProjectStatusResponse;
import com.khuoo.portfolio.project.repository.ProjectQueryRepository;
import com.khuoo.portfolio.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import tools.jackson.databind.ObjectMapper;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

// 관리자 프로젝트 기본정보와 상세 구성 관리
@Service
@RequiredArgsConstructor
public class AdminProjectService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final ProjectRepository projectRepository;
    private final ProjectQueryRepository projectQueryRepository;
    private final AdminActionVerifier adminActionVerifier;
    private final ObjectMapper objectMapper;
    private final FileStorageService fileStorageService;
    private final LogEventLogger logEventLogger;

    // 비공개 상태를 포함한 관리자 프로젝트 전체 목록 조회
    @Transactional(readOnly = true)
    public AdminProjectListResponse findAll() {
        return new AdminProjectListResponse(
                projectQueryRepository.findAllProjects().stream()
                        .map(AdminProjectSummaryResponse::from)
                        .toList()
        );
    }

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
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                0,
                false
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
                        .map(ProjectMediaResponse::fromAdmin)
                        .toList()
        );
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
        if (request.enabled()) {
            validatePublish(project);
        }
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
        List<String> storageKeys = new ArrayList<>();
        if (project.getThumbnailStorageKey() != null) {
            storageKeys.add(project.getThumbnailStorageKey());
        }
        storageKeys.addAll(projectQueryRepository.findMedia(projectId).stream()
                .map(ProjectMedia::getStorageKey)
                .toList());
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_DELETE,
                AdminActionTarget.PROJECT,
                projectId.toString()
        );
        projectRepository.deleteProject(project);
        projectRepository.flush();
        registerDeleteCleanup(projectId, storageKeys);
    }

    // 공개 카드·상세 필수값과 고정 6개 Section 계약 검증
    private void validatePublish(Project project) {
        List<FieldErrorResponse> errors = new ArrayList<>();
        requireText(errors, "slug", project.getSlug(), "slug가 필요합니다.");
        requireText(errors, "name", project.getName(), "프로젝트명이 필요합니다.");
        if (project.getYear() == null) {
            errors.add(new FieldErrorResponse("year", "프로젝트 연도가 필요합니다."));
        }
        requireText(errors, "tagline", project.getTagline(), "한 줄 설명이 필요합니다.");
        requireText(errors, "description", project.getDescription(), "카드 설명이 필요합니다.");
        requireText(errors, "cardRole", project.getCardRole(), "카드 역할이 필요합니다.");
        requireText(errors, "summary", project.getSummary(), "상세 요약이 필요합니다.");
        requireText(errors, "detailRole", project.getDetailRole(), "상세 역할이 필요합니다.");
        if (project.getStartedAt() == null) {
            errors.add(new FieldErrorResponse("startedAt", "개발 시작일이 필요합니다."));
        }
        if (project.getTeamSize() == null || project.getTeamSize() <= 0) {
            errors.add(new FieldErrorResponse("teamSize", "참여 인원이 필요합니다."));
        }
        if (project.getThumbnailStorageKey() == null || !fileExists(project.getThumbnailStorageKey())) {
            errors.add(new FieldErrorResponse("thumbnail", "대표 이미지가 필요합니다."));
        }

        projectQueryRepository.findContent(project.getId())
                .ifPresentOrElse(
                        content -> validateContent(content, errors),
                        () -> errors.add(new FieldErrorResponse("content", "프로젝트 본문이 필요합니다."))
                );
        if (projectQueryRepository.findTechnologies(project.getId()).isEmpty()) {
            errors.add(new FieldErrorResponse("technologies", "기술을 한 개 이상 선택하세요."));
        }
        if (!errors.isEmpty()) {
            throw new ApiException(ErrorCode.PROJECT_PUBLISH_VALIDATION_ERROR, errors);
        }
    }

    // JSONB의 typed 변환과 공개 Section별 최소 콘텐츠 검증
    private void validateContent(ProjectContent content, List<FieldErrorResponse> errors) {
        ProjectContentResponse response;
        try {
            response = ProjectContentResponse.from(content, objectMapper);
        } catch (ApiException exception) {
            errors.add(new FieldErrorResponse("content", "프로젝트 본문 형식을 확인하세요."));
            return;
        }

        if (response.results().isEmpty() || response.results().stream()
                .anyMatch(item -> blank(item.title()) || blank(item.description()))) {
            errors.add(new FieldErrorResponse("content.results", "성과 내용을 한 개 이상 입력하세요."));
        }
        if (response.background().isEmpty() || response.background().stream()
                .anyMatch(item -> blank(item.body()))) {
            errors.add(new FieldErrorResponse("content.background", "문제 배경을 한 개 이상 입력하세요."));
        }
        if (response.features().isEmpty() || response.features().stream()
                .anyMatch(item -> blank(item.title()) || blank(item.description()))) {
            errors.add(new FieldErrorResponse("content.features", "주요 기능을 한 개 이상 입력하세요."));
        }
        if (response.development().isEmpty() || response.development().stream()
                .anyMatch(item -> blank(item.title()) || item.items().isEmpty()
                        || item.items().stream().anyMatch(this::blank))) {
            errors.add(new FieldErrorResponse("content.development", "개발 영역을 한 개 이상 입력하세요."));
        }
        ProjectContentResponse.Architecture architecture = response.architecture();
        List<String> architectureNodes = new ArrayList<>();
        architectureNodes.addAll(architecture.clients());
        architectureNodes.addAll(architecture.services());
        architectureNodes.addAll(architecture.dataAndExternal());
        architectureNodes.addAll(architecture.runtime());
        architectureNodes.addAll(architecture.delivery());
        if (architectureNodes.isEmpty() || architectureNodes.stream().anyMatch(this::blank)) {
            errors.add(new FieldErrorResponse("content.architecture", "아키텍처 내용을 입력하세요."));
        }
        if (response.engineering().isEmpty() || response.engineering().stream()
                .anyMatch(item -> blank(item.title()) || blank(item.problem())
                        || blank(item.solution()) || blank(item.result()))) {
            errors.add(new FieldErrorResponse("content.engineering", "문제 해결 내용을 한 개 이상 입력하세요."));
        }
    }

    // Project 삭제 Commit 이후에만 Persistent 파일 정리
    private void registerDeleteCleanup(Long projectId, List<String> storageKeys) {
        if (storageKeys.isEmpty()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                for (String storageKey : storageKeys) {
                    try {
                        fileStorageService.delete(storageKey);
                    } catch (ApiException exception) {
                        logEventLogger.error(
                                "project.file-delete.failure",
                                "프로젝트 삭제 후 파일 정리 실패",
                                Map.of(
                                        "projectId", projectId,
                                        "storageKeySuffix", safeSuffix(storageKey)
                                ),
                                exception
                        );
                    }
                }
            }
        });
    }

    private void requireText(List<FieldErrorResponse> errors, String field, String value, String message) {
        if (blank(value)) {
            errors.add(new FieldErrorResponse(field, message));
        }
    }

    private boolean fileExists(String storageKey) {
        try {
            return fileStorageService.exists(storageKey);
        } catch (ApiException exception) {
            return false;
        }
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String safeSuffix(String storageKey) {
        return storageKey.length() <= 12 ? storageKey : storageKey.substring(storageKey.length() - 12);
    }

    private Project requireProject(Long projectId) {
        return projectRepository.findProject(projectId)
                .orElseThrow(() -> new ApiException(ErrorCode.PROJECT_NOT_FOUND));
    }

    private void validateSlug(String slug) {
        boolean routeUnsafe = slug == null
                || slug.length() > 100
                || !slug.matches("[a-z0-9]+(?:-[a-z0-9]+)*");
        if (routeUnsafe) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
