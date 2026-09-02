package com.khuoo.portfolio.project.domain;

import com.khuoo.portfolio.common.util.PortfolioEnums.ProjectMediaType;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// Project Draft Nullable과 미디어 용도 Domain 계약 검증
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

    // Project Media의 Storage Key와 CONTENT 용도 보존
    @Test
    void createsTypedProjectMedia() {
        ProjectMedia media = ProjectMedia.create(
                15L,
                "projects/15/content/2a22886f-378c-45cd-8548-4f93b9036594.webp",
                ProjectMediaType.CONTENT,
                "본문",
                "본문 이미지",
                2
        );

        assertThat(media.getProjectId()).isEqualTo(15L);
        assertThat(media.getStorageKey()).startsWith("projects/15/content/");
        assertThat(media.getMediaType()).isEqualTo(ProjectMediaType.CONTENT);
        assertThat(media.getDisplayOrder()).isEqualTo(2);
    }
}
