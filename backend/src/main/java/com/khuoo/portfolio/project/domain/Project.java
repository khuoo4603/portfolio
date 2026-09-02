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

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Objects;

// 프로젝트 카드와 상세 상단의 기본정보
@Getter
@Entity
@Table(name = "projects")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String slug;

    @Column(nullable = false, length = 200)
    private String name;

    @Column
    private Short year;

    @Column(length = 300)
    private String tagline;

    @Column
    private String description;

    @Column(name = "card_role", length = 150)
    private String cardRole;

    @Column
    private String summary;

    @Column(name = "detail_role", length = 200)
    private String detailRole;

    @Column(name = "started_at")
    private LocalDate startedAt;

    @Column(name = "ended_at")
    private LocalDate endedAt;

    @Column(name = "team_size")
    private Short teamSize;

    @Column(name = "thumbnail_storage_key", length = 255)
    private String thumbnailStorageKey;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    private Project(
            String slug,
            String name,
            Short year,
            String tagline,
            String description,
            String cardRole,
            String summary,
            String detailRole,
            LocalDate startedAt,
            LocalDate endedAt,
            Short teamSize,
            String thumbnailStorageKey,
            int displayOrder,
            boolean enabled
    ) {
        this.slug = slug;
        this.name = name;
        this.year = year;
        this.tagline = tagline;
        this.description = description;
        this.cardRole = cardRole;
        this.summary = summary;
        this.detailRole = detailRole;
        this.startedAt = startedAt;
        this.endedAt = endedAt;
        this.teamSize = teamSize;
        this.thumbnailStorageKey = thumbnailStorageKey;
        this.displayOrder = displayOrder;
        this.enabled = enabled;
    }

    // 관리자 프로젝트 기본정보 생성
    public static Project create(
            String slug,
            String name,
            Short year,
            String tagline,
            String description,
            String cardRole,
            String summary,
            String detailRole,
            LocalDate startedAt,
            LocalDate endedAt,
            Short teamSize,
            String thumbnailStorageKey,
            int displayOrder,
            boolean enabled
    ) {
        return new Project(
                slug,
                name,
                year,
                tagline,
                description,
                cardRole,
                summary,
                detailRole,
                startedAt,
                endedAt,
                teamSize,
                thumbnailStorageKey,
                displayOrder,
                enabled
        );
    }

    // 전달 필드 기반 프로젝트 기본정보 변경
    public void update(
            String newSlug,
            String newName,
            Short newYear,
            String newTagline,
            String newDescription,
            String newCardRole,
            String newSummary,
            String newDetailRole,
            LocalDate newStartedAt,
            LocalDate newEndedAt,
            Short newTeamSize,
            String newThumbnailStorageKey,
            int newDisplayOrder,
            OffsetDateTime changedAt
    ) {
        boolean changed = !Objects.equals(slug, newSlug)
                || !Objects.equals(name, newName)
                || !Objects.equals(year, newYear)
                || !Objects.equals(tagline, newTagline)
                || !Objects.equals(description, newDescription)
                || !Objects.equals(cardRole, newCardRole)
                || !Objects.equals(summary, newSummary)
                || !Objects.equals(detailRole, newDetailRole)
                || !Objects.equals(startedAt, newStartedAt)
                || !Objects.equals(endedAt, newEndedAt)
                || !Objects.equals(teamSize, newTeamSize)
                || !Objects.equals(thumbnailStorageKey, newThumbnailStorageKey)
                || displayOrder != newDisplayOrder;
        if (!changed) {
            return;
        }

        slug = newSlug;
        name = newName;
        year = newYear;
        tagline = newTagline;
        description = newDescription;
        cardRole = newCardRole;
        summary = newSummary;
        detailRole = newDetailRole;
        startedAt = newStartedAt;
        endedAt = newEndedAt;
        teamSize = newTeamSize;
        thumbnailStorageKey = newThumbnailStorageKey;
        displayOrder = newDisplayOrder;
        updatedAt = changedAt;
    }

    // 프로젝트 공개 상태 변경
    public void changeStatus(boolean newEnabled, OffsetDateTime changedAt) {
        if (enabled == newEnabled) {
            return;
        }
        enabled = newEnabled;
        updatedAt = changedAt;
    }
}
