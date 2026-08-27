package com.khuoo.portfolio;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;

import jakarta.persistence.EntityManagerFactory;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 공개 Portfolio·Project 응답 필터·정렬·JSONB·N+1 통합 검증
@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@AutoConfigureMockMvc
class PublicSiteIntegrationTests extends SiteIntegrationTestSupport {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private EntityManagerFactory entityManagerFactory;

    // 공개 Portfolio의 활성 필터·표시 순서·카드 기술·Resume Metadata 검증
    @Test
    void portfolioFiltersAndOrdersEveryPublicCollection() throws Exception {
        jdbcTemplate.update("""
                INSERT INTO portfolio_contents (category, content_code, content_value)
                VALUES ('COMMON', 'POSITION', 'Backend'), ('COMMON', 'NAME', 'Kim')
                """);
        jdbcTemplate.update("""
                INSERT INTO profile_entries (entry_type, title, featured, display_order, enabled)
                VALUES ('EDUCATION', 'disabled', TRUE, 0, FALSE),
                       ('ACTIVITY', 'featured false', FALSE, 1, TRUE),
                       ('AWARD', 'featured true', TRUE, 1, TRUE)
                """);
        Long javaId = technology("Java", "LANGUAGE", true);
        Long hiddenId = technology("Hidden", "BACKEND", false);
        Long unmappedId = technology("Unmapped", "INFRA", true);
        jdbcTemplate.update("INSERT INTO portfolio_technologies VALUES (?, 2), (?, 0)", javaId, hiddenId);
        Long later = project("later", true, 2);
        Long first = project("first", true, 1);
        project("disabled", false, 0);
        jdbcTemplate.update("""
                INSERT INTO project_technologies
                    (project_id, technology_id, show_on_card, highlighted, display_order)
                VALUES (?, ?, TRUE, FALSE, 2), (?, ?, FALSE, TRUE, 0), (?, ?, TRUE, FALSE, 0)
                """, first, javaId, first, unmappedId, later, javaId);
        jdbcTemplate.update("""
                INSERT INTO external_links (name, url, display_order, enabled)
                VALUES ('disabled', 'https://disabled.example', 0, FALSE),
                       ('later', 'https://later.example', 2, TRUE),
                       ('first', 'https://first.example', 1, TRUE)
                """);

        mockMvc.perform(get("/api/v1/public/portfolio"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.portfolioContents.length()").value(2))
                .andExpect(jsonPath("$.profileEntries.length()").value(2))
                .andExpect(jsonPath("$.profileEntries[0].title").value("featured false"))
                .andExpect(jsonPath("$.profileEntries[0].featured").value(false))
                .andExpect(jsonPath("$.portfolioTechnologies.length()").value(1))
                .andExpect(jsonPath("$.portfolioTechnologies[0].name").value("Java"))
                .andExpect(jsonPath("$.projects.length()").value(2))
                .andExpect(jsonPath("$.projects[0].slug").value("first"))
                .andExpect(jsonPath("$.projects[0].technologies.length()").value(1))
                .andExpect(jsonPath("$.projects[0].technologies[0].name").value("Java"))
                .andExpect(jsonPath("$.projects[1].slug").value("later"))
                .andExpect(jsonPath("$.externalLinks.length()").value(2))
                .andExpect(jsonPath("$.externalLinks[0].name").value("first"))
                .andExpect(jsonPath("$.resume").value((Object) null));

        jdbcTemplate.update("""
                INSERT INTO resume_files (id, original_name, storage_key, size_bytes, content_type, updated_at)
                VALUES (1, 'resume.pdf', 'random.pdf', 10, 'application/pdf', '2026-08-27T12:00:00+09:00')
                """);
        mockMvc.perform(get("/api/v1/public/portfolio"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.resume.fileName").value("resume.pdf"))
                .andExpect(jsonPath("$.resume.updatedAt").value("2026-08-27T12:00:00+09:00"));
    }

    // 공개 Project의 전체 기술·typed JSONB·미디어와 비공개 404 동일 응답 검증
    @Test
    void projectDetailReturnsTypedContentAndHidesUnavailableProjects() throws Exception {
        Long technologyId = technology("Spring", "BACKEND", true);
        Long projectId = project("typed-project", true, 0);
        Long emptyProjectId = project("empty-project", true, 1);
        project("private-project", false, 2);
        jdbcTemplate.update("""
                INSERT INTO project_technologies
                    (project_id, technology_id, show_on_card, highlighted, display_order)
                VALUES (?, ?, FALSE, TRUE, 3)
                """, projectId, technologyId);
        jdbcTemplate.update("""
                INSERT INTO project_contents (
                    project_id, results_json, background_json, features_json,
                    development_json, architecture_json, engineering_json
                )
                VALUES (?, '[{"title":"Result"}]', '["Background"]', '[{"title":"Feature"}]',
                        '[{"title":"Backend","items":["API"]}]',
                        '{"services":["Spring"]}',
                        '[{"title":"Issue","summary":"S","problem":"P","solution":"F","result":"R"}]')
                """, projectId);
        jdbcTemplate.update("""
                INSERT INTO project_media (project_id, image_url, label, alt_text, display_order)
                VALUES (?, '/two.png', NULL, NULL, 2), (?, '/one.png', 'one', 'alt', 0)
                """, projectId, projectId);

        String response = mockMvc.perform(get("/api/v1/public/projects/typed-project"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.technologies.length()").value(1))
                .andExpect(jsonPath("$.technologies[0].highlighted").value(true))
                .andExpect(jsonPath("$.content.results[0].title").value("Result"))
                .andExpect(jsonPath("$.content.background[0]").value("Background"))
                .andExpect(jsonPath("$.content.architecture.services[0]").value("Spring"))
                .andExpect(jsonPath("$.media[0].imageUrl").value("/one.png"))
                .andReturn().getResponse().getContentAsString();
        JsonNode content = objectMapper.readTree(response).get("content");
        assertThat(content.isObject()).isTrue();
        assertThat(content.get("results").isArray()).isTrue();
        assertThat(content.get("results").isString()).isFalse();

        mockMvc.perform(get("/api/v1/public/projects/empty-project"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(emptyProjectId))
                .andExpect(jsonPath("$.content.results.length()").value(0))
                .andExpect(jsonPath("$.content.background.length()").value(0))
                .andExpect(jsonPath("$.content.features.length()").value(0))
                .andExpect(jsonPath("$.content.development.length()").value(0))
                .andExpect(jsonPath("$.content.architecture").isMap())
                .andExpect(jsonPath("$.content.engineering.length()").value(0));
        mockMvc.perform(get("/api/v1/public/projects/private-project"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
        mockMvc.perform(get("/api/v1/public/projects/missing"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    // Project 증가와 무관한 카드 기술 일괄 Query 수 검증
    @Test
    void portfolioTechnologyQueryCountDoesNotGrowPerProject() throws Exception {
        Long technologyId = technology("Java", "LANGUAGE", true);
        Long first = project("n-one", true, 0);
        jdbcTemplate.update("INSERT INTO project_technologies VALUES (?, ?, TRUE, FALSE, 0)", first, technologyId);
        Statistics statistics = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();

        statistics.clear();
        mockMvc.perform(get("/api/v1/public/portfolio")).andExpect(status().isOk());
        long oneProjectQueries = statistics.getPrepareStatementCount();

        Long second = project("n-two", true, 1);
        Long third = project("n-three", true, 2);
        jdbcTemplate.update("INSERT INTO project_technologies VALUES (?, ?, TRUE, FALSE, 0)", second, technologyId);
        jdbcTemplate.update("INSERT INTO project_technologies VALUES (?, ?, TRUE, FALSE, 0)", third, technologyId);
        statistics.clear();
        mockMvc.perform(get("/api/v1/public/portfolio")).andExpect(status().isOk());

        assertThat(statistics.getPrepareStatementCount()).isEqualTo(oneProjectQueries);
    }

    private Long technology(String name, String category, boolean enabled) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO technology_master (name, category, icon_url, enabled)
                VALUES (?, ?, '/icon.svg', ?)
                RETURNING id
                """, Long.class, name, category, enabled);
    }

    private Long project(String slug, boolean enabled, int displayOrder) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO projects (
                    slug, name, year, tagline, description, card_role, display_order, enabled
                )
                VALUES (?, ?, 2026, ?, 'description', 'Backend', ?, ?)
                RETURNING id
                """, Long.class, slug, slug, slug + " tagline", displayOrder, enabled);
    }
}
