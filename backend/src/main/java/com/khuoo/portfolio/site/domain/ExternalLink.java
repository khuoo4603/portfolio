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
import java.util.Objects;

// 공개 포트폴리오 외부 연결 정보
@Getter
@Entity
@Table(name = "external_links")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ExternalLink {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false)
    private String url;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    private ExternalLink(String name, String url, int displayOrder, boolean enabled) {
        this.name = name;
        this.url = url;
        this.displayOrder = displayOrder;
        this.enabled = enabled;
    }

    // 관리자 외부 링크 생성
    public static ExternalLink create(String name, String url, int displayOrder, boolean enabled) {
        return new ExternalLink(name, url, displayOrder, enabled);
    }

    // 전달 필드 반영 후 실제 변경 여부 반환
    public boolean update(
            String newName,
            String newUrl,
            int newDisplayOrder,
            boolean newEnabled,
            OffsetDateTime changedAt
    ) {
        boolean changed = !Objects.equals(name, newName)
                || !Objects.equals(url, newUrl)
                || displayOrder != newDisplayOrder
                || enabled != newEnabled;
        if (!changed) {
            return false;
        }

        name = newName;
        url = newUrl;
        displayOrder = newDisplayOrder;
        enabled = newEnabled;
        updatedAt = changedAt;
        return true;
    }
}
