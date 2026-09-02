package com.khuoo.portfolio.project.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.json.JsonMapper;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.common.util.PortfolioEnums.ProjectMediaType;
import com.khuoo.portfolio.file.service.FileStorageService;
import com.khuoo.portfolio.file.service.ImageFileValidator;
import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.project.domain.ProjectContent;
import com.khuoo.portfolio.project.domain.ProjectMedia;
import com.khuoo.portfolio.project.domain.ProjectTechnology;
import com.khuoo.portfolio.project.dto.AdminProjectDetailResponse;
import com.khuoo.portfolio.project.dto.AdminProjectResponse;
import com.khuoo.portfolio.project.dto.AdminProjectTechnologyResponse;
import com.khuoo.portfolio.project.dto.ProjectContentResponse;
import com.khuoo.portfolio.project.dto.ProjectContentSaveRequest;
import com.khuoo.portfolio.project.dto.ProjectMediaResponse;
import com.khuoo.portfolio.project.dto.ProjectSaveMetadata;
import com.khuoo.portfolio.project.repository.ProjectQueryRepository;
import com.khuoo.portfolio.project.repository.ProjectRepository;
import com.khuoo.portfolio.site.domain.Technology;
import com.khuoo.portfolio.site.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import tools.jackson.databind.ObjectMapper;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// PROJECT_UPDATE 1회 기반 Project Editor 전체 Draft와 파일 수명주기 저장
@Service
@RequiredArgsConstructor
public class ProjectEditorService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");
    private static final JsonMapper CONTENT_MAPPER = JsonMapper.builder().build();

    private final ProjectRepository projectRepository;
    private final ProjectQueryRepository projectQueryRepository;
    private final SiteRepository siteRepository;
    private final AdminActionVerifier adminActionVerifier;
    private final ImageFileValidator imageFileValidator;
    private final FileStorageService fileStorageService;
    private final LogEventLogger logEventLogger;
    private final ObjectMapper objectMapper;

    // 기본정보·본문·기술·Thumbnail·Media 통합 저장
    @Transactional(noRollbackFor = ApiException.class)
    public AdminProjectDetailResponse save(
            Long projectId,
            ProjectSaveMetadata metadata,
            MultipartFile thumbnail,
            List<MultipartFile> mediaFiles,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        Project project = requireProject(projectId);
        List<MultipartFile> files = mediaFiles == null ? List.of() : List.copyOf(mediaFiles);
        List<ProjectMedia> currentMedia = projectQueryRepository.findMedia(projectId);
        Map<Long, ProjectMedia> currentById = currentMedia.stream()
                .collect(Collectors.toMap(ProjectMedia::getId, Function.identity()));

        validateProject(projectId, metadata.project());
        validateTechnologies(projectId, metadata.technologies());
        validateThumbnail(metadata.thumbnailMode(), thumbnail);
        MediaPlan mediaPlan = validateMedia(metadata.mediaChanges(), files, currentById);
        validateContentReferences(metadata.content(), mediaPlan, currentById);

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROJECT_UPDATE,
                AdminActionTarget.PROJECT,
                projectId.toString()
        );

        List<String> newStorageKeys = new ArrayList<>();
        List<String> oldStorageKeys = new ArrayList<>();
        StoredChanges stored;
        try {
            stored = storeFiles(projectId, metadata, thumbnail, files, newStorageKeys);
        } catch (ApiException exception) {
            cleanupNow(projectId, newStorageKeys);
            throw exception;
        }

        collectOldFiles(project, mediaPlan.deleted(), metadata.thumbnailMode(), oldStorageKeys);
        registerFileLifecycle(projectId, newStorageKeys, oldStorageKeys);

        OffsetDateTime changedAt = now();
        String thumbnailKey = switch (metadata.thumbnailMode()) {
            case KEEP -> project.getThumbnailStorageKey();
            case REMOVE -> null;
            case UPLOAD -> stored.thumbnailStorageKey();
        };
        ProjectSaveMetadata.ProjectFields fields = metadata.project();
        project.update(
                fields.slug(),
                fields.name(),
                fields.year(),
                fields.tagline(),
                fields.description(),
                fields.cardRole(),
                fields.summary(),
                fields.detailRole(),
                fields.startedAt(),
                fields.endedAt(),
                fields.teamSize(),
                thumbnailKey,
                fields.displayOrder(),
                changedAt
        );
        project.markEdited(changedAt);

        mediaPlan.kept().forEach((media, change) -> media.update(
                change.label(),
                change.altText(),
                change.displayOrder(),
                changedAt
        ));
        List<ProjectMedia> uploadedMedia = projectRepository.saveMedia(stored.uploadedMedia());
        Map<String, Long> uploadedIds = new HashMap<>();
        for (int index = 0; index < stored.uploadClientKeys().size(); index++) {
            uploadedIds.put(stored.uploadClientKeys().get(index), uploadedMedia.get(index).getId());
        }

        ProjectContentResponse normalizedContent = normalizeContent(metadata.content(), uploadedIds);
        saveContent(projectId, normalizedContent, changedAt);
        projectRepository.replaceTechnologies(projectId, metadata.technologies().stream()
                .map(item -> ProjectTechnology.create(
                        projectId,
                        item.technologyId(),
                        item.showOnCard(),
                        item.highlighted(),
                        item.displayOrder()
                ))
                .toList());
        projectRepository.deleteMedia(mediaPlan.deleted());
        projectRepository.flush();
        return detail(project);
    }

    private void validateProject(Long projectId, ProjectSaveMetadata.ProjectFields fields) {
        if (projectRepository.existsSlug(fields.slug(), projectId)) {
            throw new ApiException(ErrorCode.PROJECT_SLUG_CONFLICT);
        }
        if (fields.endedAt() != null
                && fields.startedAt() != null
                && fields.endedAt().isBefore(fields.startedAt())) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
    }

    private void validateTechnologies(Long projectId, List<ProjectSaveMetadata.TechnologyItem> items) {
        Set<Long> requestedIds = new HashSet<>();
        for (ProjectSaveMetadata.TechnologyItem item : items) {
            if (!requestedIds.add(item.technologyId())) {
                throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
            }
        }
        Map<Long, Technology> technologies = siteRepository.findTechnologies(requestedIds).stream()
                .collect(Collectors.toMap(Technology::getId, Function.identity()));
        if (technologies.size() != requestedIds.size()) {
            throw new ApiException(ErrorCode.TECHNOLOGY_NOT_FOUND);
        }
        Set<Long> linkedIds = projectQueryRepository.findAdminTechnologies(projectId).stream()
                .map(view -> view.technologyId())
                .collect(Collectors.toSet());
        boolean hasDisabledNewLink = technologies.values().stream()
                .anyMatch(technology -> !technology.isEnabled() && !linkedIds.contains(technology.getId()));
        if (hasDisabledNewLink) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
    }

    private void validateThumbnail(ProjectSaveMetadata.ThumbnailMode mode, MultipartFile thumbnail) {
        boolean hasFile = thumbnail != null && !thumbnail.isEmpty();
        if ((mode == ProjectSaveMetadata.ThumbnailMode.UPLOAD) != hasFile) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        if (hasFile) {
            imageFileValidator.validate(thumbnail);
        }
    }

    private MediaPlan validateMedia(
            List<ProjectSaveMetadata.MediaChange> changes,
            List<MultipartFile> files,
            Map<Long, ProjectMedia> currentById
    ) {
        Set<Long> handledIds = new HashSet<>();
        Set<String> clientKeys = new HashSet<>();
        Set<Integer> uploadIndexes = new HashSet<>();
        Map<ProjectMedia, ProjectSaveMetadata.MediaChange> kept = new LinkedHashMap<>();
        List<ProjectMedia> deleted = new ArrayList<>();
        Map<String, ProjectMediaType> uploadedTypes = new HashMap<>();

        for (ProjectSaveMetadata.MediaChange change : changes) {
            switch (change.action()) {
                case KEEP -> {
                    ProjectMedia media = validateExistingChange(change, currentById, handledIds, true);
                    kept.put(media, change);
                }
                case DELETE -> deleted.add(validateExistingChange(change, currentById, handledIds, false));
                case UPLOAD -> {
                    if (change.id() != null
                            || blank(change.clientKey())
                            || change.uploadIndex() == null
                            || change.mediaType() == null
                            || change.displayOrder() == null
                            || !clientKeys.add(change.clientKey())
                            || !uploadIndexes.add(change.uploadIndex())
                            || change.uploadIndex() >= files.size()) {
                        throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
                    }
                    uploadedTypes.put(change.clientKey(), change.mediaType());
                }
            }
        }
        if (uploadIndexes.size() != files.size()) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        files.forEach(imageFileValidator::validate);
        return new MediaPlan(kept, deleted, uploadedTypes);
    }

    private ProjectMedia validateExistingChange(
            ProjectSaveMetadata.MediaChange change,
            Map<Long, ProjectMedia> currentById,
            Set<Long> handledIds,
            boolean keep
    ) {
        ProjectMedia media = change.id() == null ? null : currentById.get(change.id());
        if (media == null
                || !handledIds.add(change.id())
                || change.clientKey() != null
                || change.uploadIndex() != null) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        if (keep) {
            if (change.mediaType() != media.getMediaType() || change.displayOrder() == null) {
                throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
            }
        } else if (change.mediaType() != null
                || change.label() != null
                || change.altText() != null
                || change.displayOrder() != null) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        return media;
    }

    private void validateContentReferences(
            ProjectContentSaveRequest content,
            MediaPlan mediaPlan,
            Map<Long, ProjectMedia> currentById
    ) {
        Set<Long> deletedIds = mediaPlan.deleted().stream()
                .map(ProjectMedia::getId)
                .collect(Collectors.toSet());
        List<ProjectContentSaveRequest.MediaReference> references = new ArrayList<>();
        references.addAll(content.background());
        references.addAll(content.features());
        references.addAll(content.development());
        references.addAll(content.engineering());
        for (ProjectContentSaveRequest.MediaReference reference : references) {
            if (reference.mediaId() != null && !blank(reference.clientKey())) {
                throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
            }
            if (reference.mediaId() != null) {
                ProjectMedia media = currentById.get(reference.mediaId());
                if (media == null
                        || media.getMediaType() != ProjectMediaType.CONTENT
                        || deletedIds.contains(media.getId())) {
                    throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
                }
            }
            if (!blank(reference.clientKey())
                    && mediaPlan.uploadedTypes().get(reference.clientKey()) != ProjectMediaType.CONTENT) {
                throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
            }
        }
    }

    private StoredChanges storeFiles(
            Long projectId,
            ProjectSaveMetadata metadata,
            MultipartFile thumbnail,
            List<MultipartFile> files,
            List<String> newStorageKeys
    ) {
        String thumbnailKey = null;
        if (metadata.thumbnailMode() == ProjectSaveMetadata.ThumbnailMode.UPLOAD) {
            ImageFileValidator.ValidatedImage validated = imageFileValidator.validate(thumbnail);
            thumbnailKey = fileStorageService.store(
                    thumbnail,
                    "projects/" + projectId + "/thumbnail",
                    validated.extension()
            ).storageKey();
            newStorageKeys.add(thumbnailKey);
        }

        List<ProjectMedia> uploaded = new ArrayList<>();
        List<String> uploadClientKeys = new ArrayList<>();
        List<ProjectSaveMetadata.MediaChange> uploadChanges = metadata.mediaChanges().stream()
                .filter(change -> change.action() == ProjectSaveMetadata.MediaAction.UPLOAD)
                .toList();
        for (ProjectSaveMetadata.MediaChange change : uploadChanges) {
            MultipartFile file = files.get(change.uploadIndex());
            ImageFileValidator.ValidatedImage validated = imageFileValidator.validate(file);
            String directory = "projects/" + projectId + "/"
                    + (change.mediaType() == ProjectMediaType.CAROUSEL ? "carousel" : "content");
            String storageKey = fileStorageService.store(file, directory, validated.extension()).storageKey();
            newStorageKeys.add(storageKey);
            uploaded.add(ProjectMedia.create(
                    projectId,
                    storageKey,
                    change.mediaType(),
                    change.label(),
                    change.altText(),
                    change.displayOrder()
            ));
            uploadClientKeys.add(change.clientKey());
        }
        return new StoredChanges(thumbnailKey, uploaded, uploadClientKeys);
    }

    private ProjectContentResponse normalizeContent(
            ProjectContentSaveRequest content,
            Map<String, Long> uploadedIds
    ) {
        return new ProjectContentResponse(
                content.results().stream()
                        .map(item -> new ProjectContentResponse.ResultItem(item.title(), item.description()))
                        .toList(),
                content.background().stream()
                        .map(item -> new ProjectContentResponse.BackgroundItem(
                                item.title(), item.body(), mediaId(item, uploadedIds)))
                        .toList(),
                content.features().stream()
                        .map(item -> new ProjectContentResponse.FeatureItem(
                                item.title(), item.description(), mediaId(item, uploadedIds)))
                        .toList(),
                content.development().stream()
                        .map(item -> new ProjectContentResponse.DevelopmentItem(
                                item.title(), item.items(), mediaId(item, uploadedIds)))
                        .toList(),
                new ProjectContentResponse.Architecture(
                        content.architecture().clients(),
                        content.architecture().services(),
                        content.architecture().dataAndExternal(),
                        content.architecture().runtime(),
                        content.architecture().delivery()
                ),
                content.engineering().stream()
                        .map(item -> new ProjectContentResponse.EngineeringItem(
                                item.title(),
                                item.summary(),
                                item.problem(),
                                item.solution(),
                                item.result(),
                                mediaId(item, uploadedIds)
                        ))
                        .toList()
        );
    }

    private Long mediaId(ProjectContentSaveRequest.MediaReference reference, Map<String, Long> uploadedIds) {
        return blank(reference.clientKey()) ? reference.mediaId() : uploadedIds.get(reference.clientKey());
    }

    private void saveContent(Long projectId, ProjectContentResponse content, OffsetDateTime changedAt) {
        JsonNode results = CONTENT_MAPPER.valueToTree(content.results());
        JsonNode background = CONTENT_MAPPER.valueToTree(content.background());
        JsonNode features = CONTENT_MAPPER.valueToTree(content.features());
        JsonNode development = CONTENT_MAPPER.valueToTree(content.development());
        JsonNode architecture = CONTENT_MAPPER.valueToTree(content.architecture());
        JsonNode engineering = CONTENT_MAPPER.valueToTree(content.engineering());
        ProjectContent entity = projectQueryRepository.findContent(projectId).orElse(null);
        if (entity == null) {
            entity = ProjectContent.create(
                    projectId,
                    results,
                    background,
                    features,
                    development,
                    architecture,
                    engineering,
                    changedAt
            );
        } else {
            entity.replace(
                    results,
                    background,
                    features,
                    development,
                    architecture,
                    engineering,
                    changedAt
            );
        }
        projectRepository.saveContent(entity);
    }

    private AdminProjectDetailResponse detail(Project project) {
        return new AdminProjectDetailResponse(
                AdminProjectResponse.from(project),
                projectQueryRepository.findAdminTechnologies(project.getId()).stream()
                        .map(AdminProjectTechnologyResponse::from)
                        .toList(),
                projectQueryRepository.findContent(project.getId())
                        .map(content -> ProjectContentResponse.from(content, objectMapper))
                        .orElseGet(ProjectContentResponse::empty),
                projectQueryRepository.findMedia(project.getId()).stream()
                        .map(ProjectMediaResponse::fromAdmin)
                        .toList()
        );
    }

    private void collectOldFiles(
            Project project,
            List<ProjectMedia> deleted,
            ProjectSaveMetadata.ThumbnailMode thumbnailMode,
            List<String> oldStorageKeys
    ) {
        if (thumbnailMode != ProjectSaveMetadata.ThumbnailMode.KEEP
                && project.getThumbnailStorageKey() != null) {
            oldStorageKeys.add(project.getThumbnailStorageKey());
        }
        deleted.stream().map(ProjectMedia::getStorageKey).forEach(oldStorageKeys::add);
    }

    private void registerFileLifecycle(Long projectId, List<String> newKeys, List<String> oldKeys) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                cleanupNow(projectId, oldKeys);
            }

            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    cleanupNow(projectId, newKeys);
                }
            }
        });
    }

    private void cleanupNow(Long projectId, List<String> storageKeys) {
        for (String storageKey : storageKeys) {
            try {
                fileStorageService.delete(storageKey);
            } catch (ApiException exception) {
                logEventLogger.error(
                        "project.file-cleanup.failure",
                        "프로젝트 파일 수명주기 정리 실패",
                        Map.of("projectId", projectId, "storageKeySuffix", safeSuffix(storageKey)),
                        exception
                );
            }
        }
    }

    private Project requireProject(Long projectId) {
        return projectRepository.findProject(projectId)
                .orElseThrow(() -> new ApiException(ErrorCode.PROJECT_NOT_FOUND));
    }

    private boolean blank(String value) {
        return value == null || value.isBlank();
    }

    private String safeSuffix(String storageKey) {
        return storageKey.length() <= 12 ? storageKey : storageKey.substring(storageKey.length() - 12);
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }

    private record MediaPlan(
            Map<ProjectMedia, ProjectSaveMetadata.MediaChange> kept,
            List<ProjectMedia> deleted,
            Map<String, ProjectMediaType> uploadedTypes
    ) {
    }

    private record StoredChanges(
            String thumbnailStorageKey,
            List<ProjectMedia> uploadedMedia,
            List<String> uploadClientKeys
    ) {
    }
}
