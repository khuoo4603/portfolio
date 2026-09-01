package com.khuoo.portfolio.tool.domain;

import com.khuoo.portfolio.common.util.PortfolioEnums.ToolLinkCategory;
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
import java.util.Objects;

// Links Tool의 공통 웹사이트·서비스 연결 정보
@Getter
@Entity
@Table(name = "tool_links")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ToolLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 500)
    private String description;

    @Column(nullable = false)
    private String url;

    @Column(name = "image_storage_key", length = 255)
    private String imageStorageKey;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ToolLinkCategory category;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    private ToolLink(
            String name,
            String description,
            String url,
            String imageStorageKey,
            ToolLinkCategory category,
            int displayOrder,
            boolean enabled
    ) {
        this.name = name;
        this.description = description;
        this.url = url;
        this.imageStorageKey = imageStorageKey;
        this.category = category;
        this.displayOrder = displayOrder;
        this.enabled = enabled;
    }

    // 관리자 Tool Link 생성
    public static ToolLink create(
            String name,
            String description,
            String url,
            String imageStorageKey,
            ToolLinkCategory category,
            int displayOrder,
            boolean enabled
    ) {
        return new ToolLink(name, description, url, imageStorageKey, category, displayOrder, enabled);
    }

    // 전달 필드 반영 후 실제 변경 여부 반환
    public boolean update(
            String newName,
            String newDescription,
            String newUrl,
            String newImageStorageKey,
            ToolLinkCategory newCategory,
            int newDisplayOrder,
            boolean newEnabled,
            OffsetDateTime changedAt
    ) {
        boolean changed = !Objects.equals(name, newName)
                || !Objects.equals(description, newDescription)
                || !Objects.equals(url, newUrl)
                || !Objects.equals(imageStorageKey, newImageStorageKey)
                || category != newCategory
                || displayOrder != newDisplayOrder
                || enabled != newEnabled;
        if (!changed) {
            return false;
        }

        name = newName;
        description = newDescription;
        url = newUrl;
        imageStorageKey = newImageStorageKey;
        category = newCategory;
        displayOrder = newDisplayOrder;
        enabled = newEnabled;
        updatedAt = changedAt;
        return true;
    }
}
