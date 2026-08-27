package com.khuoo.portfolio.tool.repository;

import com.khuoo.portfolio.tool.domain.Tool;
import com.khuoo.portfolio.tool.domain.ToolLink;

import java.util.Optional;

// Tool 단건 저장·변경 Repository 경계
public interface ToolRepository {

    // Tool Key 기반 Registry 조회
    Optional<Tool> findTool(String toolKey);

    // Tool Link 식별자 조회
    Optional<ToolLink> findLink(Long linkId);

    // 신규 Tool Link 저장
    ToolLink saveLink(ToolLink link);

    // Tool Link 삭제
    void deleteLink(ToolLink link);

    // 변경 SQL 즉시 반영
    void flush();
}
