package com.khuoo.portfolio.site.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

// 메인 기술 노출 대상과 표시 순서
@Getter
@Entity
@Table(name = "portfolio_technologies")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PortfolioTechnology {

    @Id
    @Column(name = "technology_id", nullable = false)
    private Long technologyId;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    private PortfolioTechnology(Long technologyId, int displayOrder) {
        this.technologyId = technologyId;
        this.displayOrder = displayOrder;
    }

    // 메인 기술 구성 항목 생성
    public static PortfolioTechnology create(Long technologyId, int displayOrder) {
        return new PortfolioTechnology(technologyId, displayOrder);
    }
}
