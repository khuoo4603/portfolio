package com.khuoo.portfolio.project.controller;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.project.dto.AdminProjectDetailResponse;
import com.khuoo.portfolio.project.dto.AdminProjectListResponse;
import com.khuoo.portfolio.project.dto.ProjectCreateRequest;
import com.khuoo.portfolio.project.dto.ProjectCreateResponse;
import com.khuoo.portfolio.project.dto.ProjectStatusRequest;
import com.khuoo.portfolio.project.dto.ProjectStatusResponse;
import com.khuoo.portfolio.project.dto.ProjectSaveMetadata;
import com.khuoo.portfolio.project.service.AdminProjectService;
import com.khuoo.portfolio.project.service.ProjectEditorService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Pattern;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

import static org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE;

// ADMIN 전용 프로젝트 기본정보와 상세 구성 관리 API
@Validated
@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/admin/projects")
public class AdminProjectController {

    private final AdminProjectService adminProjectService;
    private final ProjectEditorService projectEditorService;

    // 비공개 상태를 포함한 관리자 프로젝트 전체 목록 조회
    @Operation(summary = "프로젝트 관리 목록 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "프로젝트 목록 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음")
    })
    @GetMapping
    public AdminProjectListResponse findAll() {
        return adminProjectService.findAll();
    }

    // 관리자 재인증 후 프로젝트 생성
    @Operation(summary = "프로젝트 생성")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "프로젝트 생성 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "409", description = "프로젝트 slug 중복")
    })
    @PostMapping
    public ResponseEntity<ProjectCreateResponse> create(
            @Valid @RequestBody ProjectCreateRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(adminProjectService.create(request, currentAdmin, challengeId, code));
    }

    // 비공개 상태를 포함한 프로젝트 편집 상세 조회
    @Operation(summary = "프로젝트 관리 상세 조회")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "프로젝트 상세 조회 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "ADMIN 권한 없음"),
            @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    @GetMapping("/{projectId}")
    public AdminProjectDetailResponse find(@PathVariable Long projectId) {
        return adminProjectService.find(projectId);
    }

    // PROJECT_UPDATE 1회 기반 Editor 전체 Draft와 이미지 통합 저장
    @Operation(summary = "프로젝트 Editor 통합 저장")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "프로젝트 통합 저장 성공"),
            @ApiResponse(responseCode = "400", description = "Metadata 또는 이미지 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    @PutMapping(value = "/{projectId}", consumes = MULTIPART_FORM_DATA_VALUE)
    public AdminProjectDetailResponse save(
            @PathVariable Long projectId,
            @Valid @RequestPart("metadata") ProjectSaveMetadata metadata,
            @RequestPart(value = "thumbnail", required = false) MultipartFile thumbnail,
            @RequestPart(value = "architectureImage", required = false) MultipartFile architectureImage,
            @RequestPart(value = "mediaFiles", required = false) List<MultipartFile> mediaFiles,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return projectEditorService.save(
                projectId,
                metadata,
                thumbnail,
                architectureImage,
                mediaFiles,
                currentAdmin,
                challengeId,
                code
        );
    }

    // 관리자 재인증 후 프로젝트 공개 상태 변경
    @Operation(summary = "프로젝트 공개 상태 변경")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "프로젝트 공개 상태 변경 성공"),
            @ApiResponse(responseCode = "400", description = "요청값 검증 실패"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    @PatchMapping("/{projectId}/status")
    public ProjectStatusResponse changeStatus(
            @PathVariable Long projectId,
            @Valid @RequestBody ProjectStatusRequest request,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        return adminProjectService.changeStatus(projectId, request, currentAdmin, challengeId, code);
    }

    // 관리자 재인증 후 프로젝트와 하위 구성 삭제
    @Operation(summary = "프로젝트 삭제")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "프로젝트 삭제 성공"),
            @ApiResponse(responseCode = "401", description = "비로그인 상태"),
            @ApiResponse(responseCode = "403", description = "권한 또는 재인증 실패"),
            @ApiResponse(responseCode = "404", description = "프로젝트 없음")
    })
    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> delete(
            @PathVariable Long projectId,
            @AuthenticationPrincipal AccountPrincipal currentAdmin,
            @RequestHeader(PortfolioConstants.Header.ADMIN_CHALLENGE_ID) UUID challengeId,
            @Pattern(regexp = "\\d{6}", message = "인증번호는 숫자 6자리여야 합니다.")
            @RequestHeader(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE) String code
    ) {
        adminProjectService.delete(projectId, currentAdmin, challengeId, code);
        return ResponseEntity.noContent().build();
    }

}
