package com.khuoo.portfolio.project.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.io.Serializable;

// 프로젝트별 기술 연결과 공개 표시 속성
@Getter
@Entity
@IdClass(ProjectTechnology.ProjectTechnologyId.class)
@Table(name = "project_technologies")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectTechnology {

    @Id
    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Id
    @Column(name = "technology_id", nullable = false)
    private Long technologyId;

    @Column(name = "show_on_card", nullable = false)
    private boolean showOnCard;

    @Column(nullable = false)
    private boolean highlighted;

    @Column(name = "display_order", nullable = false)
    private int displayOrder;

    private ProjectTechnology(
            Long projectId,
            Long technologyId,
            boolean showOnCard,
            boolean highlighted,
            int displayOrder
    ) {
        this.projectId = projectId;
        this.technologyId = technologyId;
        this.showOnCard = showOnCard;
        this.highlighted = highlighted;
        this.displayOrder = displayOrder;
    }

    // 프로젝트 기술 연결 항목 생성
    public static ProjectTechnology create(
            Long projectId,
            Long technologyId,
            boolean showOnCard,
            boolean highlighted,
            int displayOrder
    ) {
        return new ProjectTechnology(projectId, technologyId, showOnCard, highlighted, displayOrder);
    }

    // 프로젝트와 기술의 복합 식별자
    @EqualsAndHashCode
    @NoArgsConstructor
    public static class ProjectTechnologyId implements Serializable {

        private Long projectId;
        private Long technologyId;
    }
}
