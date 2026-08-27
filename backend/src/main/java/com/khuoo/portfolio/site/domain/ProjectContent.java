package com.khuoo.portfolio.site.domain;

import com.fasterxml.jackson.databind.JsonNode;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;

// 프로젝트 상세의 고정 6개 JSON 본문
@Getter
@Entity
@Table(name = "project_contents")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProjectContent {

    @Id
    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "results_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode results;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "background_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode background;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "features_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode features;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "development_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode development;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "architecture_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode architecture;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "engineering_json", nullable = false, columnDefinition = "jsonb")
    private JsonNode engineering;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;
}
