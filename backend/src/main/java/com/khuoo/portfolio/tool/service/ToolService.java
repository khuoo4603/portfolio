package com.khuoo.portfolio.tool.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.file.service.FileStorageService;
import com.khuoo.portfolio.tool.domain.ToolLink;
import com.khuoo.portfolio.tool.dto.ToolItemResponse;
import com.khuoo.portfolio.tool.dto.ToolLinkListResponse;
import com.khuoo.portfolio.tool.dto.ToolLinkResponse;
import com.khuoo.portfolio.tool.dto.ToolListResponse;
import com.khuoo.portfolio.tool.repository.ToolQueryRepository;
import com.khuoo.portfolio.tool.repository.ToolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

// 인증 사용자의 활성 Tool과 Links 조회
@Service
@RequiredArgsConstructor
public class ToolService {

    private final ToolRepository toolRepository;
    private final ToolQueryRepository toolQueryRepository;
    private final FileStorageService fileStorageService;

    // 활성 상태 Tool Launcher 목록 조회
    public ToolListResponse findEnabledTools() {
        return new ToolListResponse(
                toolQueryRepository.findEnabledTools().stream()
                        .map(ToolItemResponse::from)
                        .toList()
        );
    }

    // LINKS 활성 확인 후 공개 상태 Link 전체 조회
    public ToolLinkListResponse findLinks() {
        requireEnabled(PortfolioConstants.ToolKey.LINKS);
        return new ToolLinkListResponse(
                toolQueryRepository.findEnabledLinks().stream()
                        .map(ToolLinkResponse::from)
                        .toList()
        );
    }

    // LINKS와 Link 활성 확인 후 Custom Image 조회
    public ToolLinkMedia findLinkMedia(Long linkId) {
        requireEnabled(PortfolioConstants.ToolKey.LINKS);
        ToolLink link = toolRepository.findLink(linkId)
                .filter(ToolLink::isEnabled)
                .orElseThrow(() -> new ApiException(ErrorCode.TOOL_LINK_NOT_FOUND));
        String storageKey = link.getImageStorageKey();
        if (storageKey == null) {
            throw new ApiException(ErrorCode.TOOL_LINK_NOT_FOUND);
        }

        String contentType = contentType(storageKey);
        try {
            if (!fileStorageService.exists(storageKey)) {
                throw new ApiException(ErrorCode.TOOL_LINK_NOT_FOUND);
            }
            return new ToolLinkMedia(contentType, fileStorageService.open(storageKey));
        } catch (ApiException exception) {
            throw new ApiException(ErrorCode.TOOL_LINK_NOT_FOUND, exception);
        }
    }

    // 직접 Tool API 접근 전 Registry 활성 상태 검증
    public void requireEnabled(String toolKey) {
        boolean enabled = toolRepository.findTool(toolKey)
                .map(tool -> tool.isEnabled())
                .orElse(false);
        if (!enabled) {
            throw new ApiException(ErrorCode.TOOL_NOT_FOUND);
        }
    }

    private String contentType(String storageKey) {
        if (storageKey.endsWith(".jpg")) {
            return "image/jpeg";
        }
        if (storageKey.endsWith(".png")) {
            return "image/png";
        }
        if (storageKey.endsWith(".webp")) {
            return "image/webp";
        }
        throw new ApiException(ErrorCode.TOOL_LINK_NOT_FOUND);
    }

    // Binary 응답용 이미지 MIME과 Resource
    public record ToolLinkMedia(String contentType, Resource resource) {
    }
}
