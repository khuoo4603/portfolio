package com.khuoo.portfolio.tool.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.util.PortfolioEnums.ToolLinkCategory;
import com.khuoo.portfolio.common.validation.PatchValues;
import com.khuoo.portfolio.common.validation.WebUrlValidator;
import com.khuoo.portfolio.file.service.FileStorageService;
import com.khuoo.portfolio.file.service.ImageFileValidator;
import com.khuoo.portfolio.tool.domain.Tool;
import com.khuoo.portfolio.tool.domain.ToolLink;
import com.khuoo.portfolio.tool.dto.AdminToolLinkResponse;
import com.khuoo.portfolio.tool.dto.AdminToolResponse;
import com.khuoo.portfolio.tool.dto.AdminToolsResponse;
import com.khuoo.portfolio.tool.dto.ToolLinkCreateRequest;
import com.khuoo.portfolio.tool.dto.ToolLinkCreateImageMode;
import com.khuoo.portfolio.tool.dto.ToolLinkUpdateRequest;
import com.khuoo.portfolio.tool.dto.ToolLinkUpdateImageMode;
import com.khuoo.portfolio.tool.dto.ToolStatusRequest;
import com.khuoo.portfolio.tool.dto.ToolStatusResponse;
import com.khuoo.portfolio.tool.repository.ToolQueryRepository;
import com.khuoo.portfolio.tool.repository.ToolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Map;

// 관리자 Tool Registry 조회·상태 변경과 Tool Link CRUD
@Service
@RequiredArgsConstructor
public class AdminToolService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");
    private static final String LINK_IMAGE_DIRECTORY = "tools/links";

    private final ToolRepository toolRepository;
    private final ToolQueryRepository toolQueryRepository;
    private final WebUrlValidator webUrlValidator;
    private final FileStorageService fileStorageService;
    private final ImageFileValidator imageFileValidator;
    private final LogEventLogger logEventLogger;

    // 비활성 항목을 포함한 Tool Registry와 Links 통합 조회
    public AdminToolsResponse findAll() {
        return new AdminToolsResponse(
                toolQueryRepository.findTools().stream()
                        .map(AdminToolResponse::from)
                        .toList(),
                toolQueryRepository.findLinks().stream()
                        .map(AdminToolLinkResponse::from)
                        .toList()
        );
    }

    // 대상 존재 확인 후 Tool 활성 상태 변경
    @Transactional
    public ToolStatusResponse changeStatus(String toolKey, ToolStatusRequest request) {
        Tool tool = requireTool(toolKey);
        tool.changeEnabled(request.enabled(), now());
        toolRepository.flush();
        return ToolStatusResponse.from(tool);
    }

    // URL과 이미지 조합 검증 후 Tool Link 생성
    @Transactional
    public AdminToolLinkResponse createLink(ToolLinkCreateRequest request, MultipartFile image) {
        webUrlValidator.validate(request.url());
        validateImagePart(request.imageMode(), image);

        String imageStorageKey = null;
        if (request.imageMode() == ToolLinkCreateImageMode.UPLOAD) {
            ImageFileValidator.ValidatedImage validated = imageFileValidator.validate(image);
            imageStorageKey = fileStorageService.store(image, LINK_IMAGE_DIRECTORY, validated.extension()).storageKey();
            registerFileLifecycle(imageStorageKey, null, null);
        }

        ToolLink link = ToolLink.create(
                request.name(),
                request.description(),
                request.url(),
                imageStorageKey,
                request.category(),
                request.displayOrder() == null ? 0 : request.displayOrder(),
                request.enabled() == null || request.enabled()
        );
        return AdminToolLinkResponse.from(toolRepository.saveLink(link));
    }

    // 대상과 PATCH 값·이미지 조합 검증 후 Tool Link 수정
    @Transactional
    public AdminToolLinkResponse updateLink(
            Long linkId,
            ToolLinkUpdateRequest request,
            MultipartFile image
    ) {
        ToolLink link = requireLink(linkId);
        validateImagePart(request.imageMode(), image);
        if (request.imageMode() == ToolLinkUpdateImageMode.KEEP) {
            PatchValues.requireAny(
                    request.name(),
                    request.description(),
                    request.url(),
                    request.category(),
                    request.displayOrder(),
                    request.enabled()
            );
        }
        String name = PatchValues.present(request.name())
                ? PatchValues.requiredString(request.name(), 100)
                : link.getName();
        String description = PatchValues.present(request.description())
                ? PatchValues.nullableString(request.description(), 500)
                : link.getDescription();
        String url = PatchValues.present(request.url())
                ? PatchValues.requiredString(request.url(), Integer.MAX_VALUE)
                : link.getUrl();
        ToolLinkCategory category = PatchValues.present(request.category())
                ? PatchValues.enumValue(request.category(), ToolLinkCategory.class)
                : link.getCategory();
        int displayOrder = PatchValues.present(request.displayOrder())
                ? PatchValues.nonNegativeInt(request.displayOrder())
                : link.getDisplayOrder();
        boolean enabled = PatchValues.present(request.enabled())
                ? PatchValues.booleanValue(request.enabled())
                : link.isEnabled();
        webUrlValidator.validate(url);

        String previousStorageKey = link.getImageStorageKey();
        String imageStorageKey = previousStorageKey;
        if (request.imageMode() == ToolLinkUpdateImageMode.DEFAULT) {
            imageStorageKey = null;
        } else if (request.imageMode() == ToolLinkUpdateImageMode.UPLOAD) {
            ImageFileValidator.ValidatedImage validated = imageFileValidator.validate(image);
            imageStorageKey = fileStorageService.store(image, LINK_IMAGE_DIRECTORY, validated.extension()).storageKey();
        }
        if (request.imageMode() != ToolLinkUpdateImageMode.KEEP) {
            registerFileLifecycle(imageStorageKey, previousStorageKey, linkId);
        }

        link.update(name, description, url, imageStorageKey, category, displayOrder, enabled, now());
        toolRepository.flush();
        return AdminToolLinkResponse.from(link);
    }

    // 대상 삭제 Commit 후 기존 Custom Image 정리
    @Transactional
    public void deleteLink(Long linkId) {
        ToolLink link = requireLink(linkId);
        String previousStorageKey = link.getImageStorageKey();
        toolRepository.deleteLink(link);
        toolRepository.flush();
        if (previousStorageKey != null) {
            registerFileLifecycle(null, previousStorageKey, linkId);
        }
    }

    private void validateImagePart(ToolLinkCreateImageMode imageMode, MultipartFile image) {
        if (imageMode == null
                || (imageMode == ToolLinkCreateImageMode.DEFAULT && image != null)
                || (imageMode == ToolLinkCreateImageMode.UPLOAD && image == null)) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
    }

    private void validateImagePart(ToolLinkUpdateImageMode imageMode, MultipartFile image) {
        if (imageMode == null
                || (imageMode != ToolLinkUpdateImageMode.UPLOAD && image != null)
                || (imageMode == ToolLinkUpdateImageMode.UPLOAD && image == null)) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
    }

    private void registerFileLifecycle(String newStorageKey, String previousStorageKey, Long linkId) {
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                if (previousStorageKey != null) {
                    deleteFile(previousStorageKey, linkId, true);
                }
            }

            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED && newStorageKey != null) {
                    deleteFile(newStorageKey, linkId, false);
                }
            }
        });
    }

    private void deleteFile(String storageKey, Long linkId, boolean previousFile) {
        try {
            fileStorageService.delete(storageKey);
        } catch (ApiException ignored) {
            Map<String, ?> fields = linkId == null ? Map.of() : Map.of("linkId", linkId);
            logEventLogger.error(
                    previousFile
                            ? "tool.link-image-previous-cleanup.failure"
                            : "tool.link-image-new-cleanup.failure",
                    previousFile
                            ? "Tool Link 변경 후 기존 이미지 정리 실패"
                            : "Tool Link DB 변경 실패 후 신규 이미지 정리 실패",
                    fields,
                    null
            );
        }
    }

    private Tool requireTool(String toolKey) {
        return toolRepository.findTool(toolKey)
                .orElseThrow(() -> new ApiException(ErrorCode.TOOL_NOT_FOUND));
    }

    private ToolLink requireLink(Long linkId) {
        return toolRepository.findLink(linkId)
                .orElseThrow(() -> new ApiException(ErrorCode.TOOL_LINK_NOT_FOUND));
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
