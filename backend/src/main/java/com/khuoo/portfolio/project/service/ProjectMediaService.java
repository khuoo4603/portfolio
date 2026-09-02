package com.khuoo.portfolio.project.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.file.service.FileStorageService;
import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.project.domain.ProjectContent;
import com.khuoo.portfolio.project.domain.ProjectMedia;
import com.khuoo.portfolio.project.repository.ProjectQueryRepository;
import com.khuoo.portfolio.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

// 프로젝트 소유권과 공개 상태 검증 기반 이미지 Resource 제공
@Service
@RequiredArgsConstructor
public class ProjectMediaService {

    private final ProjectRepository projectRepository;
    private final ProjectQueryRepository projectQueryRepository;
    private final FileStorageService fileStorageService;

    // ADMIN Session용 비공개 포함 Thumbnail 조회
    @Transactional(readOnly = true)
    public ProjectImage findAdminThumbnail(Long projectId) {
        Project project = requireProject(projectId);
        return open(project.getThumbnailStorageKey());
    }

    // ADMIN Session의 비공개 포함 Architecture Image 조회
    @Transactional(readOnly = true)
    public ProjectImage findAdminArchitecture(Long projectId) {
        requireProject(projectId);
        return open(requireContent(projectId).getArchitectureImageStorageKey());
    }

    // ADMIN Session용 프로젝트 소속 Media 조회
    @Transactional(readOnly = true)
    public ProjectImage findAdminMedia(Long projectId, Long mediaId) {
        requireProject(projectId);
        return open(requireMedia(projectId, mediaId).getStorageKey());
    }

    // 공개 상태 프로젝트 Thumbnail 조회
    @Transactional(readOnly = true)
    public ProjectImage findPublicThumbnail(Long projectId) {
        Project project = requireEnabledProject(projectId);
        return open(project.getThumbnailStorageKey());
    }

    // 공개 상태 프로젝트 Architecture Image 조회
    @Transactional(readOnly = true)
    public ProjectImage findPublicArchitecture(Long projectId) {
        requireEnabledProject(projectId);
        return open(requireContent(projectId).getArchitectureImageStorageKey());
    }

    // 공개 상태 프로젝트 소속 Media 조회
    @Transactional(readOnly = true)
    public ProjectImage findPublicMedia(Long projectId, Long mediaId) {
        requireEnabledProject(projectId);
        return open(requireMedia(projectId, mediaId).getStorageKey());
    }

    private ProjectImage open(String storageKey) {
        if (storageKey == null) {
            throw new ApiException(ErrorCode.COMMON_NOT_FOUND);
        }
        Resource resource = fileStorageService.open(storageKey);
        MediaType contentType = MediaTypeFactory.getMediaType(resource)
                .orElse(MediaType.APPLICATION_OCTET_STREAM);
        return new ProjectImage(contentType, resource);
    }

    private Project requireProject(Long projectId) {
        return projectRepository.findProject(projectId)
                .orElseThrow(() -> new ApiException(ErrorCode.PROJECT_NOT_FOUND));
    }

    private Project requireEnabledProject(Long projectId) {
        Project project = requireProject(projectId);
        if (!project.isEnabled()) {
            throw new ApiException(ErrorCode.PROJECT_NOT_FOUND);
        }
        return project;
    }

    private ProjectMedia requireMedia(Long projectId, Long mediaId) {
        return projectQueryRepository.findMedia(projectId, mediaId)
                .orElseThrow(() -> new ApiException(ErrorCode.COMMON_NOT_FOUND));
    }

    private ProjectContent requireContent(Long projectId) {
        return projectQueryRepository.findContent(projectId)
                .orElseThrow(() -> new ApiException(ErrorCode.COMMON_NOT_FOUND));
    }

    // Project Media 응답용 MIME과 Resource
    public record ProjectImage(MediaType contentType, Resource resource) {
    }
}
