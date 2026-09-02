package com.khuoo.portfolio.project.service;

import com.khuoo.portfolio.file.service.FileStorageService;
import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.project.domain.ProjectContent;
import com.khuoo.portfolio.project.repository.ProjectQueryRepository;
import com.khuoo.portfolio.project.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;

import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

// V2 고정 Seed Key 기준 Asset 최초 복원과 관리자 교체 파일 보존 검증
class ProjectSeedAssetInitializerTests {

    // DB가 고정 Architecture Seed Key를 유지할 때만 누락 Asset 복원
    @Test
    void restoresMatchingArchitectureSeed() {
        ProjectRepository projectRepository = mock(ProjectRepository.class);
        ProjectQueryRepository projectQueryRepository = mock(ProjectQueryRepository.class);
        FileStorageService fileStorageService = mock(FileStorageService.class);
        Project project = project(7L);
        ProjectContent content = content(
                "projects/7/architecture/b2051589-7615-4bc8-aec5-f48f6ec84653.png"
        );
        when(projectRepository.findBySlug("kyvc")).thenReturn(Optional.of(project));
        when(projectRepository.findBySlug("shkutrack")).thenReturn(Optional.empty());
        when(projectQueryRepository.findContent(7L)).thenReturn(Optional.of(content));

        new ProjectSeedAssetInitializer(
                projectRepository,
                projectQueryRepository,
                fileStorageService
        ).run(null);

        verify(fileStorageService).copyIfMissing(
                any(Resource.class),
                eq("projects/7/architecture/b2051589-7615-4bc8-aec5-f48f6ec84653.png")
        );
    }

    // 관리자가 교체한 Architecture Key에는 기존 Seed Asset 미복원
    @Test
    void doesNotResurrectReplacedArchitectureSeed() {
        ProjectRepository projectRepository = mock(ProjectRepository.class);
        ProjectQueryRepository projectQueryRepository = mock(ProjectQueryRepository.class);
        FileStorageService fileStorageService = mock(FileStorageService.class);
        Project project = project(7L);
        ProjectContent content = content("projects/7/architecture/user-replacement.png");
        when(projectRepository.findBySlug("kyvc")).thenReturn(Optional.of(project));
        when(projectRepository.findBySlug("shkutrack")).thenReturn(Optional.empty());
        when(projectQueryRepository.findContent(7L)).thenReturn(Optional.of(content));

        new ProjectSeedAssetInitializer(
                projectRepository,
                projectQueryRepository,
                fileStorageService
        ).run(null);

        verify(fileStorageService, never()).copyIfMissing(any(Resource.class), any(String.class));
    }

    private Project project(Long id) {
        Project project = mock(Project.class);
        when(project.getId()).thenReturn(id);
        when(project.getThumbnailStorageKey()).thenReturn(null);
        return project;
    }

    private ProjectContent content(String architectureKey) {
        ProjectContent content = mock(ProjectContent.class);
        when(content.getArchitectureImageStorageKey()).thenReturn(architectureKey);
        return content;
    }
}
