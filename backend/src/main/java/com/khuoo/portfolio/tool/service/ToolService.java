package com.khuoo.portfolio.tool.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.util.PortfolioEnums.ToolLinkCategory;
import com.khuoo.portfolio.tool.dto.ToolItemResponse;
import com.khuoo.portfolio.tool.dto.ToolLinkListResponse;
import com.khuoo.portfolio.tool.dto.ToolLinkResponse;
import com.khuoo.portfolio.tool.dto.ToolListResponse;
import com.khuoo.portfolio.tool.repository.ToolQueryRepository;
import com.khuoo.portfolio.tool.repository.ToolRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

// 인증 사용자의 활성 Tool과 Links 조회
@Service
@RequiredArgsConstructor
public class ToolService {

    private final ToolRepository toolRepository;
    private final ToolQueryRepository toolQueryRepository;

    // 활성 상태 Tool Launcher 목록 조회
    public ToolListResponse findEnabledTools() {
        return new ToolListResponse(
                toolQueryRepository.findEnabledTools().stream()
                        .map(ToolItemResponse::from)
                        .toList()
        );
    }

    // LINKS 활성 확인 후 공개 상태와 선택 분류 기반 링크 조회
    public ToolLinkListResponse findLinks(ToolLinkCategory category) {
        requireEnabled(PortfolioConstants.ToolKey.LINKS);
        return new ToolLinkListResponse(
                toolQueryRepository.findEnabledLinks(category).stream()
                        .map(ToolLinkResponse::from)
                        .toList()
        );
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
}
