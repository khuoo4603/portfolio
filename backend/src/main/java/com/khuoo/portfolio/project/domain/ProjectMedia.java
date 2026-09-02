package com.khuoo.portfolio.project.domain;

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
import java.util.Objects;

// 프로젝트 Carousel 이미지의 내부 Storage 참조
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
            String label,
            String altText,
            int displayOrder
    ) {
        this.projectId = projectId;
        this.storageKey = storageKey;
        this.label = label;
        this.altText = altText;
        this.displayOrder = displayOrder;
    }

    // 프로젝트 미디어 내부 Storage 참조 생성
    public static ProjectMedia create(
            Long projectId,
            String storageKey,
            String label,
            String altText,
            int displayOrder
    ) {
        return new ProjectMedia(projectId, storageKey, label, altText, displayOrder);
    }

    // 기존 Carousel 편집 Metadata와 순서 변경
    public void update(String newLabel, String newAltText, int newDisplayOrder, OffsetDateTime changedAt) {
        boolean changed = !Objects.equals(label, newLabel)
                || !Objects.equals(altText, newAltText)
                || displayOrder != newDisplayOrder;
        if (!changed) {
            return;
        }
        label = newLabel;
        altText = newAltText;
        displayOrder = newDisplayOrder;
        updatedAt = changedAt;
    }
}
