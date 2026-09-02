package com.khuoo.portfolio;

import com.khuoo.portfolio.file.service.FileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.MediaType;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import javax.sql.DataSource;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 관리자 Project 목록·Draft 생성·공개 상태·삭제 API 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
class AdminProjectIntegrationTests extends SiteIntegrationTestSupport {

    private static final String PROJECTS_PATH = "/api/v1/admin/projects";
    private static final byte[] THUMBNAIL = {
            0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
    };

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private DataSource dataSource;

    @Autowired
    private FileStorageService fileStorageService;

    // Seed Project 전체 목록과 ADMIN Session 경계 검증
    @Test
    void projectListReturnsSeedProjectsForAdminOnly() throws Exception {
        restoreSeedProjects();

        mockMvc.perform(get(PROJECTS_PATH)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(PROJECTS_PATH).with(user())).andExpect(status().isForbidden());
        String response = mockMvc.perform(get(PROJECTS_PATH).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(3))
                .andExpect(jsonPath("$.items[0].name").value("KYvC"))
                .andExpect(jsonPath("$.items[0].slug").value("kyvc"))
                .andExpect(jsonPath("$.items[0].enabled").value(true))
                .andExpect(jsonPath("$.items[1].name").value("SHKUTrack"))
                .andExpect(jsonPath("$.items[1].enabled").value(false))
                .andExpect(jsonPath("$.items[2].name").value("SHKULoad"))
                .andExpect(jsonPath("$.items[0].thumbnailUrl")
                        .value(org.hamcrest.Matchers.startsWith(
                                "/api/v1/admin/media/projects/")))
                .andReturn().getResponse().getContentAsString();
        Long kyvcId = objectMapper.readTree(response).get("items").get(0).get("id").asLong();
        mockMvc.perform(get(PROJECTS_PATH + "/" + kyvcId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.project.name").value("KYvC"))
                .andExpect(jsonPath("$.technologies.length()").value(16))
                .andExpect(jsonPath("$.content.engineering.length()").value(4));

        mockMvc.perform(get("/api/v1/admin/site/projects").with(admin()))
                .andExpect(status().isNotFound());
    }

    // 최소 Draft 생성·slug·중복·PROJECT_CREATE Challenge Binding 검증
    @Test
    void minimalCreateProducesPrivateDraftWithBoundChallenge() throws Exception {
        String body = "{\"name\":\"New Project\",\"slug\":\"new-project\"}";
        mockMvc.perform(post(PROJECTS_PATH).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(post(PROJECTS_PATH).with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isForbidden());
        mockMvc.perform(post(PROJECTS_PATH).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());

        ActionChallenge wrongOperation = challenge("PROJECT_DELETE", "PROJECT", null);
        create(body, wrongOperation).andExpect(status().isForbidden());
        ActionChallenge wrongTarget = challenge("PROJECT_CREATE", "PROJECT", "new");
        create(body, wrongTarget).andExpect(status().isForbidden());
        ActionChallenge invalidSlug = challenge("PROJECT_CREATE", "PROJECT", null);
        create("{\"name\":\"Invalid\",\"slug\":\"Invalid Slug\"}", invalidSlug)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[0].field").value("slug"));
        assertThat(challengeStatus(invalidSlug.id())).isEqualTo("ACTIVE");

        ActionChallenge challenge = challenge("PROJECT_CREATE", "PROJECT", null);
        Long projectId = objectMapper.readTree(create(body, challenge)
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.name").value("New Project"))
                        .andExpect(jsonPath("$.slug").value("new-project"))
                        .andExpect(jsonPath("$.enabled").value(false))
                        .andExpect(jsonPath("$.displayOrder").value(0))
                        .andExpect(jsonPath("$.createdAt")
                                .value(org.hamcrest.Matchers.endsWith("+09:00")))
                        .andReturn().getResponse().getContentAsString())
                .get("id").asLong();
        assertThat(challengeStatus(challenge.id())).isEqualTo("USED");

        mockMvc.perform(get(PROJECTS_PATH + "/" + projectId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.project.year").value((Object) null))
                .andExpect(jsonPath("$.project.tagline").value((Object) null))
                .andExpect(jsonPath("$.project.thumbnailUrl").value((Object) null))
                .andExpect(jsonPath("$.technologies.length()").value(0))
                .andExpect(jsonPath("$.content.results.length()").value(0))
                .andExpect(jsonPath("$.content.architecture").isMap())
                .andExpect(jsonPath("$.media.length()").value(0));

        ActionChallenge duplicate = challenge("PROJECT_CREATE", "PROJECT", null);
        create(body, duplicate).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("PROJECT_SLUG_CONFLICT"));
        assertThat(challengeStatus(duplicate.id())).isEqualTo("ACTIVE");
    }

    // Draft 상세 NULL 기본값·없는 식별자·조회 권한 검증
    @Test
    void draftDetailAllowsNullsAndRequiresAdmin() throws Exception {
        Long projectId = project("draft-project", false);

        mockMvc.perform(get(PROJECTS_PATH + "/" + projectId)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(PROJECTS_PATH + "/" + projectId).with(user())).andExpect(status().isForbidden());
        mockMvc.perform(get(PROJECTS_PATH + "/" + projectId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.project.slug").value("draft-project"))
                .andExpect(jsonPath("$.project.summary").value((Object) null))
                .andExpect(jsonPath("$.project.teamSize").value((Object) null));
        mockMvc.perform(get(PROJECTS_PATH + "/999999").with(admin()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("PROJECT_NOT_FOUND"));
    }

    // 공개 ON 필수 데이터·fieldErrors·상태 불변과 OFF Public 차단 검증
    @Test
    void statusChangeValidatesPublishDataAndImmediatelyAffectsPublicApis() throws Exception {
        Long draftId = project("incomplete-project", false);
        ActionChallenge incomplete = challenge("PROJECT_STATUS_UPDATE", "PROJECT", draftId.toString());
        changeStatus(draftId, true, incomplete)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("PROJECT_PUBLISH_VALIDATION_ERROR"))
                .andExpect(jsonPath("$.message").value("프로젝트 공개에 필요한 정보를 확인하세요."))
                .andExpect(jsonPath("$.fieldErrors[*].field").value(
                        org.hamcrest.Matchers.hasItems(
                                "year", "tagline", "thumbnail", "content", "technologies"
                        )));
        assertThat(projectEnabled(draftId)).isFalse();
        assertThat(challengeStatus(incomplete.id())).isEqualTo("ACTIVE");

        Long projectId = publishableProject("publishable-project");
        jdbcTemplate.update(
                "UPDATE project_contents SET features_json = '[]'::jsonb WHERE project_id = ?",
                projectId
        );
        ActionChallenge invalidContent = challenge("PROJECT_STATUS_UPDATE", "PROJECT", projectId.toString());
        changeStatus(projectId, true, invalidContent)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[*].field")
                        .value(org.hamcrest.Matchers.hasItem("content.features")));
        assertThat(projectEnabled(projectId)).isFalse();
        assertThat(challengeStatus(invalidContent.id())).isEqualTo("ACTIVE");
        jdbcTemplate.update("""
                UPDATE project_contents
                SET features_json = '[{"title":"Feature","description":"Description"}]'::jsonb
                WHERE project_id = ?
                """, projectId);

        ActionChallenge wrongOperation = challenge("PROJECT_DELETE", "PROJECT", projectId.toString());
        changeStatus(projectId, true, wrongOperation).andExpect(status().isForbidden());
        assertThat(projectEnabled(projectId)).isFalse();

        ActionChallenge on = challenge("PROJECT_STATUS_UPDATE", "PROJECT", projectId.toString());
        changeStatus(projectId, true, on)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));
        mockMvc.perform(get("/api/v1/public/portfolio"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projects[0].slug").value("publishable-project"));
        mockMvc.perform(get("/api/v1/public/projects/publishable-project"))
                .andExpect(status().isOk());

        ActionChallenge off = challenge("PROJECT_STATUS_UPDATE", "PROJECT", projectId.toString());
        changeStatus(projectId, false, off)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
        mockMvc.perform(get("/api/v1/public/portfolio"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projects.length()").value(0));
        mockMvc.perform(get("/api/v1/public/projects/publishable-project"))
                .andExpect(status().isNotFound());
    }

    // Project 하위 Row·파일 Commit 후 삭제와 DB 실패 파일 보존 검증
    @Test
    void deleteCascadesRowsAndRemovesFilesOnlyAfterCommit() throws Exception {
        Long projectId = publishableProject("delete-project");
        String thumbnailKey = thumbnailKey(projectId);
        List<String> mediaKeys = List.of(
                "projects/" + projectId + "/carousel/first.webp",
                "projects/" + projectId + "/content/second.webp"
        );
        for (String key : mediaKeys) {
            fileStorageService.copyIfMissing(new ByteArrayResource(THUMBNAIL), key);
        }
        jdbcTemplate.update("""
                INSERT INTO project_media
                    (project_id, storage_key, media_type, display_order)
                VALUES (?, ?, 'CAROUSEL', 0), (?, ?, 'CONTENT', 0)
                """, projectId, mediaKeys.get(0), projectId, mediaKeys.get(1));

        ActionChallenge wrongTarget = challenge("PROJECT_DELETE", "PROJECT", "999999");
        remove(projectId, wrongTarget).andExpect(status().isForbidden());
        assertThat(projectCount(projectId)).isOne();

        ActionChallenge valid = challenge("PROJECT_DELETE", "PROJECT", projectId.toString());
        remove(projectId, valid).andExpect(status().isNoContent());
        assertThat(projectCount(projectId)).isZero();
        assertThat(childCount("project_contents", projectId)).isZero();
        assertThat(childCount("project_technologies", projectId)).isZero();
        assertThat(childCount("project_media", projectId)).isZero();
        assertThat(fileStorageService.exists(thumbnailKey)).isFalse();
        assertThat(mediaKeys).allMatch(key -> !fileStorageService.exists(key));

        Long failureId = publishableProject("delete-failure-project");
        String failureKey = thumbnailKey(failureId);
        createDeleteFailureTrigger();
        try {
            ActionChallenge failure = challenge("PROJECT_DELETE", "PROJECT", failureId.toString());
            remove(failureId, failure).andExpect(status().isInternalServerError());
        } finally {
            dropDeleteFailureTrigger();
        }
        assertThat(projectCount(failureId)).isOne();
        assertThat(fileStorageService.exists(failureKey)).isTrue();
        fileStorageService.delete(failureKey);
    }

    private ResultActions create(String body, ActionChallenge challenge) throws Exception {
        return mockMvc.perform(post(PROJECTS_PATH).with(admin()).with(csrf())
                .headers(actionHeaders(challenge))
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    private ResultActions changeStatus(Long projectId, boolean enabled, ActionChallenge challenge) throws Exception {
        return mockMvc.perform(patch(PROJECTS_PATH + "/" + projectId + "/status")
                .with(admin()).with(csrf()).headers(actionHeaders(challenge))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"enabled\":" + enabled + "}"));
    }

    private ResultActions remove(Long projectId, ActionChallenge challenge) throws Exception {
        return mockMvc.perform(delete(PROJECTS_PATH + "/" + projectId)
                .with(admin()).with(csrf()).headers(actionHeaders(challenge)));
    }

    private Long project(String slug, boolean enabled) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO projects (slug, name, enabled)
                VALUES (?, 'Draft Project', ?)
                RETURNING id
                """, Long.class, slug, enabled);
    }

    private Long publishableProject(String slug) {
        Long projectId = jdbcTemplate.queryForObject("""
                INSERT INTO projects (
                    slug, name, year, tagline, description, card_role, summary,
                    detail_role, started_at, team_size, display_order, enabled
                )
                VALUES (?, 'Publishable', 2026, 'Tagline', 'Description', 'Backend',
                        'Summary', 'Backend', DATE '2026-01-01', 1, 0, FALSE)
                RETURNING id
                """, Long.class, slug);
        String thumbnailKey = "projects/" + projectId + "/thumbnail/publishable.webp";
        jdbcTemplate.update("UPDATE projects SET thumbnail_storage_key = ? WHERE id = ?", thumbnailKey, projectId);
        fileStorageService.copyIfMissing(new ByteArrayResource(THUMBNAIL), thumbnailKey);
        Long technologyId = jdbcTemplate.queryForObject("""
                INSERT INTO technology_master (name, category, enabled)
                VALUES (?, 'BACKEND', TRUE)
                RETURNING id
                """, Long.class, "Tech-" + projectId);
        jdbcTemplate.update("""
                INSERT INTO project_technologies
                    (project_id, technology_id, show_on_card, highlighted, display_order)
                VALUES (?, ?, TRUE, TRUE, 0)
                """, projectId, technologyId);
        jdbcTemplate.update("""
                INSERT INTO project_contents (
                    project_id, results_json, background_json, features_json,
                    development_json, architecture_json, engineering_json
                ) VALUES (
                    ?,
                    '[{"title":"Result","description":"Description"}]',
                    '[{"body":"Background"}]',
                    '[{"title":"Feature","description":"Description"}]',
                    '[{"title":"Backend","items":["API"]}]',
                    '{"services":["Backend"]}',
                    '[{"title":"Issue","problem":"Problem","solution":"Solution","result":"Result"}]'
                )
                """, projectId);
        return projectId;
    }

    private void restoreSeedProjects() {
        jdbcTemplate.update("DELETE FROM tool_links");
        jdbcTemplate.update("DELETE FROM tools");
        ResourceDatabasePopulator populator = new ResourceDatabasePopulator();
        populator.setSqlScriptEncoding("UTF-8");
        populator.addScript(new ClassPathResource("db/migration/V2__seed_initial_data.sql"));
        populator.execute(dataSource);
    }

    private boolean projectEnabled(Long projectId) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT enabled FROM projects WHERE id = ?", Boolean.class, projectId));
    }

    private String thumbnailKey(Long projectId) {
        return jdbcTemplate.queryForObject(
                "SELECT thumbnail_storage_key FROM projects WHERE id = ?", String.class, projectId);
    }

    private int projectCount(Long projectId) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM projects WHERE id = ?", Integer.class, projectId);
    }

    private int childCount(String table, Long projectId) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE project_id = ?", Integer.class, projectId);
    }

    private void createDeleteFailureTrigger() {
        jdbcTemplate.execute("""
                CREATE OR REPLACE FUNCTION fail_project_delete()
                RETURNS trigger AS $$
                BEGIN
                    RAISE EXCEPTION 'forced project delete failure';
                END;
                $$ LANGUAGE plpgsql
                """);
        jdbcTemplate.execute("""
                CREATE TRIGGER trg_fail_project_delete
                BEFORE DELETE ON projects
                FOR EACH ROW EXECUTE FUNCTION fail_project_delete()
                """);
    }

    private void dropDeleteFailureTrigger() {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_fail_project_delete ON projects");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS fail_project_delete()");
    }
}
