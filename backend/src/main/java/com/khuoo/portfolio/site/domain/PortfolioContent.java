package com.khuoo.portfolio.site.domain;

import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCategory;
import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCode;
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

// 공개 화면의 고정 위치 문구
@Getter
@Entity
@Table(name = "portfolio_contents")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PortfolioContent {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private PortfolioContentCategory category;

    @Enumerated(EnumType.STRING)
    @Column(name = "content_code", nullable = false, length = 100)
    private PortfolioContentCode contentCode;

    @Column(name = "content_value", nullable = false)
    private String contentValue;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;
}
