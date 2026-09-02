package com.khuoo.portfolio.project.domain;

import com.khuoo.portfolio.common.util.PortfolioEnums.ProjectMediaType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

// 프로젝트 Carousel·본문 이미지의 내부 Storage 참조
@Getter
@Entity
@Table(name = "project_media")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectMedia {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "storage_key", nullable = false, length = 255)
    private String storageKey;

    @Enumerated(EnumType.STRING)
    @Column(name = "media_type", nullable = false, length = 30)
    private ProjectMediaType mediaType;

    @Column(length = 200)
    private String label;

    @Column(name = "alt_text", length = 300)
    private String altText;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    private ProjectMedia(
            Long projectId,
            String storageKey,
            ProjectMediaType mediaType,
            String label,
            String altText,
            int displayOrder
    ) {
        this.projectId = projectId;
        this.storageKey = storageKey;
        this.mediaType = mediaType;
        this.label = label;
        this.altText = altText;
        this.displayOrder = displayOrder;
    }

    // 프로젝트 미디어 내부 Storage 참조 생성
    public static ProjectMedia create(
            Long projectId,
            String storageKey,
            ProjectMediaType mediaType,
            String label,
            String altText,
            int displayOrder
    ) {
        return new ProjectMedia(projectId, storageKey, mediaType, label, altText, displayOrder);
    }
}
