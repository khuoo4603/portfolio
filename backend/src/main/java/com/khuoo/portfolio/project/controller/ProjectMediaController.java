package com.khuoo.portfolio.project.controller;

import com.khuoo.portfolio.project.service.ProjectMediaService;
import com.khuoo.portfolio.project.service.ProjectMediaService.ProjectImage;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.concurrent.TimeUnit;

// Storage Key 비노출 기반 ADMIN·Public 프로젝트 이미지 API
@RestController
@RequiredArgsConstructor
public class ProjectMediaController {

    private final ProjectMediaService projectMediaService;

    // 비공개 Draft를 포함한 ADMIN Thumbnail 조회
    @Operation(summary = "관리자 프로젝트 Thumbnail 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Thumbnail 조회 성공"),
            @ApiResponse(responseCode = "404", description = "프로젝트 또는 파일 없음")
    })
    @GetMapping("/api/v1/admin/media/projects/{projectId}/thumbnail")
    public ResponseEntity<Resource> findAdminThumbnail(@PathVariable Long projectId) {
        return response(projectMediaService.findAdminThumbnail(projectId), false);
    }

    // 비공개 Draft를 포함한 ADMIN Architecture Image 조회
    @Operation(summary = "관리자 프로젝트 Architecture Image 조회")
    @GetMapping("/api/v1/admin/media/projects/{projectId}/architecture")
    public ResponseEntity<Resource> findAdminArchitecture(@PathVariable Long projectId) {
        return response(projectMediaService.findAdminArchitecture(projectId), false);
    }

    // 비공개 Draft를 포함한 ADMIN 소속 Media 조회
    @Operation(summary = "관리자 프로젝트 Media 조회")
    @GetMapping("/api/v1/admin/media/projects/{projectId}/{mediaId}")
    public ResponseEntity<Resource> findAdminMedia(@PathVariable Long projectId, @PathVariable Long mediaId) {
        return response(projectMediaService.findAdminMedia(projectId, mediaId), false);
    }

    // 공개 상태 프로젝트 Thumbnail 조회
    @Operation(summary = "공개 프로젝트 Thumbnail 조회")
    @GetMapping("/api/v1/public/media/projects/{projectId}/thumbnail")
    public ResponseEntity<Resource> findPublicThumbnail(@PathVariable Long projectId) {
        return response(projectMediaService.findPublicThumbnail(projectId), true);
    }

    // 공개 상태 프로젝트 Architecture Image 조회
    @Operation(summary = "공개 프로젝트 Architecture Image 조회")
    @GetMapping("/api/v1/public/media/projects/{projectId}/architecture")
    public ResponseEntity<Resource> findPublicArchitecture(@PathVariable Long projectId) {
        return response(projectMediaService.findPublicArchitecture(projectId), true);
    }

    // 공개 상태 프로젝트 소속 Media 조회
    @Operation(summary = "공개 프로젝트 Media 조회")
    @GetMapping("/api/v1/public/media/projects/{projectId}/{mediaId}")
    public ResponseEntity<Resource> findPublicMedia(@PathVariable Long projectId, @PathVariable Long mediaId) {
        return response(projectMediaService.findPublicMedia(projectId, mediaId), true);
    }

    private ResponseEntity<Resource> response(ProjectImage image, boolean publicCache) {
        CacheControl cacheControl = publicCache
                ? CacheControl.maxAge(1, TimeUnit.HOURS).cachePublic()
                : CacheControl.noStore();
        return ResponseEntity.ok()
                .contentType(image.contentType())
                .cacheControl(cacheControl)
                .body(image.resource());
    }
}
