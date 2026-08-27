package com.khuoo.portfolio.tool.service;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.common.util.PortfolioEnums.ToolLinkCategory;
import com.khuoo.portfolio.common.validation.PatchValues;
import com.khuoo.portfolio.common.validation.WebUrlValidator;
import com.khuoo.portfolio.tool.domain.Tool;
import com.khuoo.portfolio.tool.domain.ToolLink;
import com.khuoo.portfolio.tool.dto.AdminToolLinkResponse;
import com.khuoo.portfolio.tool.dto.AdminToolResponse;
import com.khuoo.portfolio.tool.dto.AdminToolsResponse;
import com.khuoo.portfolio.tool.dto.ToolLinkCreateRequest;
import com.khuoo.portfolio.tool.dto.ToolLinkUpdateRequest;
import com.khuoo.portfolio.tool.dto.ToolStatusRequest;
import com.khuoo.portfolio.tool.dto.ToolStatusResponse;
import com.khuoo.portfolio.tool.repository.ToolQueryRepository;
import com.khuoo.portfolio.tool.repository.ToolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

// 관리자 Tool Registry 조회·상태 변경과 Tool Link CRUD
@Service
@RequiredArgsConstructor
public class AdminToolService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final ToolRepository toolRepository;
    private final ToolQueryRepository toolQueryRepository;
    private final AdminActionVerifier adminActionVerifier;
    private final WebUrlValidator webUrlValidator;

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

    // 대상 존재와 재인증 확인 후 Tool 활성 상태 변경
    @Transactional(noRollbackFor = ApiException.class)
    public ToolStatusResponse changeStatus(
            String toolKey,
            ToolStatusRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        Tool tool = requireTool(toolKey);
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.TOOL_STATUS_UPDATE,
                AdminActionTarget.TOOL,
                toolKey
        );
        tool.changeEnabled(request.enabled(), now());
        toolRepository.flush();
        return ToolStatusResponse.from(tool);
    }

    // URL 검증과 재인증 후 Tool Link 생성
    @Transactional(noRollbackFor = ApiException.class)
    public AdminToolLinkResponse createLink(
            ToolLinkCreateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        webUrlValidator.validate(request.url());
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.TOOL_LINK_CREATE,
                AdminActionTarget.TOOL_LINK,
                null
        );

        ToolLink link = ToolLink.create(
                request.name(),
                request.description(),
                request.url(),
                request.imageUrl(),
                request.category(),
                request.displayOrder() == null ? 0 : request.displayOrder(),
                request.enabled() == null || request.enabled()
        );
        return AdminToolLinkResponse.from(toolRepository.saveLink(link));
    }

    // 대상과 PATCH 값을 검증한 뒤 재인증 후 Tool Link 수정
    @Transactional(noRollbackFor = ApiException.class)
    public AdminToolLinkResponse updateLink(
            Long linkId,
            ToolLinkUpdateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        ToolLink link = requireLink(linkId);
        PatchValues.requireAny(
                request.name(),
                request.description(),
                request.url(),
                request.imageUrl(),
                request.category(),
                request.displayOrder(),
                request.enabled()
        );
        String name = PatchValues.present(request.name())
                ? PatchValues.requiredString(request.name(), 100)
                : link.getName();
        String description = PatchValues.present(request.description())
                ? PatchValues.nullableString(request.description(), 500)
                : link.getDescription();
        String url = PatchValues.present(request.url())
                ? PatchValues.requiredString(request.url(), Integer.MAX_VALUE)
                : link.getUrl();
        String imageUrl = PatchValues.present(request.imageUrl())
                ? PatchValues.nullableString(request.imageUrl(), Integer.MAX_VALUE)
                : link.getImageUrl();
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

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.TOOL_LINK_UPDATE,
                AdminActionTarget.TOOL_LINK,
                linkId.toString()
        );
        link.update(name, description, url, imageUrl, category, displayOrder, enabled, now());
        toolRepository.flush();
        return AdminToolLinkResponse.from(link);
    }

    // 대상 존재 확인과 재인증 후 Tool Link 삭제
    @Transactional(noRollbackFor = ApiException.class)
    public void deleteLink(
            Long linkId,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        ToolLink link = requireLink(linkId);
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.TOOL_LINK_DELETE,
                AdminActionTarget.TOOL_LINK,
                linkId.toString()
        );
        toolRepository.deleteLink(link);
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
