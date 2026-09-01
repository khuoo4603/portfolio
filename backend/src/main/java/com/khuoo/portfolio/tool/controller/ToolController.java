package com.khuoo.portfolio.tool.controller;

import com.khuoo.portfolio.tool.dto.ToolLinkListResponse;
import com.khuoo.portfolio.tool.dto.ToolListResponse;
import com.khuoo.portfolio.tool.service.ToolService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

// 인증 사용자와 관리자의 활성 Tool 조회 API
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/tools")
public class ToolController {

    private final ToolService toolService;

    // 활성 상태 Tool Launcher 목록 조회
    @Operation(summary = "사용 가능한 Tool 목록 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "활성 Tool 목록 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태")
    })
    @GetMapping
    public ToolListResponse findEnabledTools() {
        return toolService.findEnabledTools();
    }

    // LINKS 활성 확인과 공개 Link 전체 조회
    @Operation(summary = "Tool Links 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "활성 Tool Link 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "404", description = "Links Tool 비활성 상태")
    })
    @GetMapping("/links")
    public ToolLinkListResponse findLinks() {
        return toolService.findLinks();
    }

    // 활성 LINKS의 활성 Link Custom Image Binary 조회
    @Operation(summary = "Tool Link 대표 이미지 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Tool Link 대표 이미지 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "404", description = "비활성 또는 이미지 없음")
    })
    @GetMapping("/media/links/{linkId}")
    public ResponseEntity<Resource> findLinkMedia(@PathVariable Long linkId) {
        ToolService.ToolLinkMedia media = toolService.findLinkMedia(linkId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(media.contentType()))
                .cacheControl(CacheControl.noCache().cachePrivate())
                .body(media.resource());
    }
}
