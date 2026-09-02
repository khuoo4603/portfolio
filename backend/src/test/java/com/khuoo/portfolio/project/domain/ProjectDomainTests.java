package com.khuoo.portfolio.project.domain;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// Project Draft Nullable과 Carousel Media Domain 계약 검증
class ProjectDomainTests {

    // Name·Slug 외 공개 필드가 비어 있는 Draft 생성 허용
    @Test
    void createsDraftCompatibleProject() {
        Project project = Project.create(
                "draft-project",
                "Draft Project",
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                null,
                0,
                false
        );

        assertThat(project.getSlug()).isEqualTo("draft-project");
        assertThat(project.getName()).isEqualTo("Draft Project");
        assertThat(project.getYear()).isNull();
        assertThat(project.getThumbnailStorageKey()).isNull();
        assertThat(project.isEnabled()).isFalse();
    }

    // Project Media의 Carousel Storage Key 보존
    @Test
    void createsTypedProjectMedia() {
        ProjectMedia media = ProjectMedia.create(
                15L,
                "projects/15/carousel/2a22886f-378c-45cd-8548-4f93b9036594.webp",
                "화면",
                "프로젝트 화면",
                2
        );

        assertThat(media.getProjectId()).isEqualTo(15L);
        assertThat(media.getStorageKey()).startsWith("projects/15/carousel/");
        assertThat(media.getDisplayOrder()).isEqualTo(2);
    }
}
