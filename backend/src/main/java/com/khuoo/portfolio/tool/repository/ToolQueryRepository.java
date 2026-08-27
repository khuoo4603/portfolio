package com.khuoo.portfolio.tool.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.ToolLinkCategory;
import com.khuoo.portfolio.tool.domain.Tool;
import com.khuoo.portfolio.tool.domain.ToolLink;

import java.util.List;

// Tool Launcher와 Links 목록 조회 경계
public interface ToolQueryRepository {

    // 활성 상태 Tool Registry 조회
    List<Tool> findEnabledTools();

    // 비활성 포함 Tool Registry 전체 조회
    List<Tool> findTools();

    // 공개 상태와 선택 분류 기반 Tool Link 조회
    List<ToolLink> findEnabledLinks(ToolLinkCategory category);

    // 비활성 포함 Tool Link 전체 조회
    List<ToolLink> findLinks();
}
