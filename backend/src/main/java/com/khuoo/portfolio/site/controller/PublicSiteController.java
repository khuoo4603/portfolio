package com.khuoo.portfolio.site.controller;

import com.khuoo.portfolio.site.dto.PublicPortfolioResponse;
import com.khuoo.portfolio.project.dto.PublicProjectResponse;
import com.khuoo.portfolio.site.service.PublicSiteService;
import com.khuoo.portfolio.site.service.ResumeService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;

// 비로그인 접근 가능한 포트폴리오 공개 조회 API
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/public")
public class PublicSiteController {

    private final PublicSiteService publicSiteService;
    private final ResumeService resumeService;

    // 공개 메인 페이지 통합 데이터 조회
    @Operation(summary = "공개 포트폴리오 데이터 조회")
    @ApiResponse(responseCode = "200", description = "공개 포트폴리오 조회 성공")
    @GetMapping("/portfolio")
    public PublicPortfolioResponse findPortfolio() {
        return publicSiteService.findPortfolio();
    }

    // 공개 상태 프로젝트 상세 조회
    @Operation(summary = "공개 프로젝트 상세 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "공개 프로젝트 상세 조회 성공"),
            @ApiResponse(responseCode = "404", description = "프로젝트 없음 또는 비공개 상태")
    })
    @GetMapping("/projects/{slug}")
    public PublicProjectResponse findProject(@PathVariable String slug) {
        return publicSiteService.findProject(slug);
    }

    // 현재 등록된 이력서 PDF Binary 조회
    @Operation(summary = "현재 이력서 PDF 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "이력서 PDF 조회 성공"),
            @ApiResponse(responseCode = "404", description = "등록된 이력서 없음")
    })
    @GetMapping("/resume")
    public ResponseEntity<Resource> findResume() {
        ResumeService.ResumeDownload resume = resumeService.findPublic();
        ContentDisposition disposition = ContentDisposition.inline()
                .filename(resume.originalName(), StandardCharsets.UTF_8)
                .build();
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .contentType(org.springframework.http.MediaType.parseMediaType(resume.contentType()))
                .contentLength(resume.size())
                .body(resume.resource());
    }
}
