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
}
