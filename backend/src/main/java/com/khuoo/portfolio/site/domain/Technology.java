package com.khuoo.portfolio.site.domain;

import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;
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

// 포트폴리오와 프로젝트가 공유하는 기술 사전
@Getter
@Entity
@Table(name = "technology_master")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Technology {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private TechnologyCategory category;

    @Column(name = "icon_url")
    private String iconUrl;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;
}
