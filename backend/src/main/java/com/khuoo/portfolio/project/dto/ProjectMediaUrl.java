package com.khuoo.portfolio.project.dto;

import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.project.domain.ProjectContent;
import com.khuoo.portfolio.project.domain.ProjectMedia;

// 내부 Storage Key 비노출을 위한 프로젝트 미디어 API URL 조합
public final class ProjectMediaUrl {

    private ProjectMediaUrl() {
    }

    // 관리자 Thumbnail 조회 URL
    static String adminThumbnail(Project project) {
        return thumbnail(project, "/api/v1/admin/media/projects/");
    }

    // 공개 Thumbnail 조회 URL
    static String publicThumbnail(Project project) {
        return thumbnail(project, "/api/v1/public/media/projects/");
    }

    // 관리자 프로젝트 미디어 조회 URL
    static String adminMedia(ProjectMedia media) {
        return "/api/v1/admin/media/projects/" + media.getProjectId() + "/" + media.getId();
    }

    // 공개 프로젝트 미디어 조회 URL
    static String publicMedia(ProjectMedia media) {
        return "/api/v1/public/media/projects/" + media.getProjectId() + "/" + media.getId();
    }

    // 관리자 Architecture Image 조회 URL
    public static String adminArchitecture(ProjectContent content) {
        return architecture(content, "/api/v1/admin/media/projects/");
    }

    // 공개 Architecture Image 조회 URL
    public static String publicArchitecture(ProjectContent content) {
        return architecture(content, "/api/v1/public/media/projects/");
    }

    private static String thumbnail(Project project, String prefix) {
        return project.getThumbnailStorageKey() == null
                ? null
                : prefix + project.getId() + "/thumbnail";
    }

    private static String architecture(ProjectContent content, String prefix) {
        return content == null || content.getArchitectureImageStorageKey() == null
                ? null
                : prefix + content.getProjectId() + "/architecture";
    }
}
