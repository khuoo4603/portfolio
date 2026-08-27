package com.khuoo.portfolio.site.domain;

import com.khuoo.portfolio.common.util.PortfolioEnums.ProfileEntryType;
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

// 학력·경력·활동·수상·자격 공개 항목
@Getter
@Entity
@Table(name = "profile_entries")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProfileEntry {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(name = "entry_type", nullable = false, length = 30)
    private ProfileEntryType entryType;

    @Column(name = "period_text", length = 100)
    private String periodText;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String organization;

    @Column(length = 200)
    private String role;

    @Column
    private String description;

    @Column
    private String achievement;

    @Column(nullable = false)
    private boolean featured;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    private ProfileEntry(
            ProfileEntryType entryType,
            String periodText,
            String title,
            String organization,
            String role,
            String description,
            String achievement,
            boolean featured,
            int displayOrder,
            boolean enabled
    ) {
        this.entryType = entryType;
        this.periodText = periodText;
        this.title = title;
        this.organization = organization;
        this.role = role;
        this.description = description;
        this.achievement = achievement;
        this.featured = featured;
        this.displayOrder = displayOrder;
        this.enabled = enabled;
    }

    // 관리자 프로필 항목 생성
    public static ProfileEntry create(
            ProfileEntryType entryType,
            String periodText,
            String title,
            String organization,
            String role,
            String description,
            String achievement,
            boolean featured,
            int displayOrder,
            boolean enabled
    ) {
        return new ProfileEntry(
                entryType,
                periodText,
                title,
                organization,
                role,
                description,
                achievement,
                featured,
                displayOrder,
                enabled
        );
    }

    // 전달 필드 반영 후 실제 변경 여부 반환
    public boolean update(
            ProfileEntryType newEntryType,
            String newPeriodText,
            String newTitle,
            String newOrganization,
            String newRole,
            String newDescription,
            String newAchievement,
            boolean newFeatured,
            int newDisplayOrder,
            boolean newEnabled,
            OffsetDateTime changedAt
    ) {
        boolean changed = entryType != newEntryType
                || !Objects.equals(periodText, newPeriodText)
                || !Objects.equals(title, newTitle)
                || !Objects.equals(organization, newOrganization)
                || !Objects.equals(role, newRole)
                || !Objects.equals(description, newDescription)
                || !Objects.equals(achievement, newAchievement)
                || featured != newFeatured
                || displayOrder != newDisplayOrder
                || enabled != newEnabled;
        if (!changed) {
            return false;
        }

        entryType = newEntryType;
        periodText = newPeriodText;
        title = newTitle;
        organization = newOrganization;
        role = newRole;
        description = newDescription;
        achievement = newAchievement;
        featured = newFeatured;
        displayOrder = newDisplayOrder;
        enabled = newEnabled;
        updatedAt = changedAt;
        return true;
    }
}
