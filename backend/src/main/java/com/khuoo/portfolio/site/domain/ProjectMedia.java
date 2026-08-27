package com.khuoo.portfolio.site.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

// 프로젝트 상세 Carousel 이미지 참조
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

    @Column(name = "image_url", nullable = false)
    private String imageUrl;

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
            String imageUrl,
            String label,
            String altText,
            int displayOrder
    ) {
        this.projectId = projectId;
        this.imageUrl = imageUrl;
        this.label = label;
        this.altText = altText;
        this.displayOrder = displayOrder;
    }

    // 프로젝트 이미지 갤러리 항목 생성
    public static ProjectMedia create(
            Long projectId,
            String imageUrl,
            String label,
            String altText,
            int displayOrder
    ) {
        return new ProjectMedia(projectId, imageUrl, label, altText, displayOrder);
    }
}
