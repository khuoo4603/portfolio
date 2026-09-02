package com.khuoo.portfolio.project.service;

import com.khuoo.portfolio.file.service.FileStorageService;
import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.project.domain.ProjectContent;
import com.khuoo.portfolio.project.repository.ProjectQueryRepository;
import com.khuoo.portfolio.project.repository.ProjectRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.util.List;

// 기존 Project 이미지의 Persistent Storage Seed 복원
@Component
@RequiredArgsConstructor
public class ProjectSeedAssetInitializer implements ApplicationRunner {

    private static final List<SeedAsset> THUMBNAILS = List.of(
            new SeedAsset(
                    "kyvc",
                    "2a22886f-378c-45cd-8548-4f93b9036594.webp",
                    "seed/projects/kyvc-thumbnail.webp"
            ),
            new SeedAsset(
                    "shkutrack",
                    "383297dd-5394-5945-2c56-050f58034417.webp",
                    "seed/projects/shkutrack-thumbnail.webp"
            )
    );
    private static final SeedAsset KYVC_ARCHITECTURE = new SeedAsset(
            "kyvc",
            "b2051589-7615-4bc8-aec5-f48f6ec84653.png",
            "seed/projects/kyvc-architecture.png"
    );

    private final ProjectRepository projectRepository;
    private final ProjectQueryRepository projectQueryRepository;
    private final FileStorageService fileStorageService;

    // V2 Seed Key와 일치하는 기존 이미지만 최초 복원
    @Override
    public void run(ApplicationArguments args) {
        for (SeedAsset asset : THUMBNAILS) {
            Project project = projectRepository.findBySlug(asset.slug()).orElse(null);
            if (project == null) {
                continue;
            }

            String expectedKey = "projects/" + project.getId() + "/thumbnail/" + asset.fileName();
            if (!expectedKey.equals(project.getThumbnailStorageKey())) {
                continue;
            }

            fileStorageService.copyIfMissing(new ClassPathResource(asset.resourcePath()), expectedKey);
        }

        Project project = projectRepository.findBySlug(KYVC_ARCHITECTURE.slug()).orElse(null);
        if (project == null) {
            return;
        }
        ProjectContent content = projectQueryRepository.findContent(project.getId()).orElse(null);
        String expectedKey = "projects/" + project.getId() + "/architecture/"
                + KYVC_ARCHITECTURE.fileName();
        if (content != null && expectedKey.equals(content.getArchitectureImageStorageKey())) {
            fileStorageService.copyIfMissing(
                    new ClassPathResource(KYVC_ARCHITECTURE.resourcePath()),
                    expectedKey
            );
        }
    }

    // 기존 Project별 고정 Seed Asset 정보
    private record SeedAsset(String slug, String fileName, String resourcePath) {
    }
}
