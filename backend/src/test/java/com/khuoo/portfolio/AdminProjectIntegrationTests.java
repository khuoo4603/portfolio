package com.khuoo.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.time.OffsetDateTime;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 관리자 Project CRUD·Challenge·Content·Technology·Media·공개 상태 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
class AdminProjectIntegrationTests extends SiteIntegrationTestSupport {

    private static final String PROJECTS_PATH = "/api/v1/admin/site/projects";

    @Autowired
    private MockMvc mockMvc;

    // Project CRUD·slug 충돌·PATCH Presence와 관리자 보안 경계 검증
    @Test
    void projectCrudRequiresAdminCsrfAndBoundChallenge() throws Exception {
        String body = createBody("Case-Slug");
        mockMvc.perform(post(PROJECTS_PATH).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isUnauthorized());
        ActionChallenge userChallenge = challenge("PROJECT_CREATE", "PROJECT", null);
        create(userChallenge, body, user(), true).andExpect(status().isForbidden());
        ActionChallenge csrfChallenge = challenge("PROJECT_CREATE", "PROJECT", null);
        create(csrfChallenge, body, admin(), false).andExpect(status().isForbidden());
        mockMvc.perform(post(PROJECTS_PATH).with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isBadRequest());

        ActionChallenge create = challenge("PROJECT_CREATE", "PROJECT", null);
        Long projectId = objectMapper.readTree(create(create, body, admin(), true)
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.slug").value("Case-Slug"))
                        .andExpect(jsonPath("$.displayOrder").value(0))
                        .andExpect(jsonPath("$.enabled").value(true))
                        .andExpect(jsonPath("$.createdAt").value(org.hamcrest.Matchers.endsWith("+09:00")))
                        .andReturn().getResponse().getContentAsString())
                .get("id").asLong();
        assertThat(count("project_contents", projectId)).isZero();

        mockMvc.perform(get(PROJECTS_PATH + "/" + projectId).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.project.slug").value("Case-Slug"))
                .andExpect(jsonPath("$.content.results.length()").value(0));

        ActionChallenge empty = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(patch(PROJECTS_PATH + "/" + projectId), empty, "{}")
                .andExpect(status().isBadRequest());
        assertThat(challengeStatus(empty.id())).isEqualTo("ACTIVE");
        ActionChallenge nullable = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(patch(PROJECTS_PATH + "/" + projectId), nullable,
                "{\"summary\":null,\"detailRole\":null,\"name\":\"Updated\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"))
                .andExpect(jsonPath("$.summary").value((Object) null));
        ActionChallenge nonNull = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(patch(PROJECTS_PATH + "/" + projectId), nonNull, "{\"name\":null}")
                .andExpect(status().isBadRequest());
        assertThat(challengeStatus(nonNull.id())).isEqualTo("ACTIVE");

        ActionChallenge conflict = challenge("PROJECT_CREATE", "PROJECT", null);
        create(conflict, createBody("Case-Slug"), admin(), true).andExpect(status().isConflict());
        assertThat(challengeStatus(conflict.id())).isEqualTo("ACTIVE");

        jdbcTemplate.update("INSERT INTO project_contents (project_id) VALUES (?)", projectId);
        Long technologyId = technology("Java", true);
        jdbcTemplate.update("INSERT INTO project_technologies VALUES (?, ?, TRUE, FALSE, 0)", projectId, technologyId);
        jdbcTemplate.update("""
                INSERT INTO project_media (project_id, storage_key, media_type)
                VALUES (?, 'projects/deleted/carousel/a.webp', 'CAROUSEL')
                """, projectId);
        ActionChallenge deleteChallenge = challenge("PROJECT_DELETE", "PROJECT", projectId.toString());
        change(delete(PROJECTS_PATH + "/" + projectId), deleteChallenge, null)
                .andExpect(status().isNoContent());
        assertThat(count("projects", projectId)).isZero();
        assertThat(count("project_contents", projectId)).isZero();
        assertThat(count("project_technologies", projectId)).isZero();
        assertThat(count("project_media", projectId)).isZero();
    }

    // ADMIN_ACTION 계정·operation·targetType·targetId·code·상태·만료 바인딩 검증
    @Test
    void projectChallengeRejectsEveryMismatchedOrUnavailableState() throws Exception {
        Long projectId = project("challenge-project", true);
        Long otherAdminId = insertAccount("other-site-admin@example.com", "다른 관리자",
                com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole.ADMIN);
        String originalName = projectName(projectId);

        ActionChallenge[] forbidden = new ActionChallenge[]{
                challenge(otherAdminId, "PROJECT_UPDATE", "PROJECT", projectId.toString(),
                        "ACTIVE", OffsetDateTime.now().plusMinutes(10)),
                challenge("PROJECT_DELETE", "PROJECT", projectId.toString()),
                challenge("PROJECT_UPDATE", "ACCOUNT", projectId.toString()),
                challenge("PROJECT_UPDATE", "PROJECT", "999999"),
                challenge(adminPrincipal.id(), "PROJECT_UPDATE", "PROJECT", projectId.toString(),
                        "USED", OffsetDateTime.now().plusMinutes(10)),
                challenge(adminPrincipal.id(), "PROJECT_UPDATE", "PROJECT", projectId.toString(),
                        "REPLACED", OffsetDateTime.now().plusMinutes(10)),
                challenge(adminPrincipal.id(), "PROJECT_UPDATE", "PROJECT", projectId.toString(),
                        "LOCKED", OffsetDateTime.now().plusMinutes(10)),
                challenge(adminPrincipal.id(), "PROJECT_UPDATE", "PROJECT", projectId.toString(),
                        "ACTIVE", OffsetDateTime.now().minusSeconds(1))
        };
        for (ActionChallenge value : forbidden) {
            change(patch(PROJECTS_PATH + "/" + projectId), value, "{\"name\":\"blocked\"}")
                    .andExpect(status().isForbidden());
            assertThat(projectName(projectId)).isEqualTo(originalName);
        }

        ActionChallenge wrongCode = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(patch(PROJECTS_PATH + "/" + projectId), wrongCode.withCode("000000"),
                "{\"name\":\"blocked\"}").andExpect(status().isForbidden());
        assertThat(jdbcTemplate.queryForObject("""
                SELECT failed_attempts FROM verification_challenges WHERE id = ?
                """, Integer.class, wrongCode.id())).isOne();
        assertThat(projectName(projectId)).isEqualTo(originalName);

        ActionChallenge valid = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(patch(PROJECTS_PATH + "/" + projectId), valid, "{\"name\":\"once\"}")
                .andExpect(status().isOk());
        change(patch(PROJECTS_PATH + "/" + projectId), valid, "{\"name\":\"twice\"}")
                .andExpect(status().isForbidden());
        assertThat(projectName(projectId)).isEqualTo("once");
    }

    // Project Content 최초 Insert·두 번째 Update·6개 Section JSONB Round-trip 검증
    @Test
    void projectContentReplacesAllTypedSectionsAtomically() throws Exception {
        Long projectId = project("content-project", true);
        String first = contentBody("First");
        ActionChallenge insert = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(put(PROJECTS_PATH + "/" + projectId + "/content"), insert, first)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].title").value("First result"))
                .andExpect(jsonPath("$.background[0].body").value("First background"))
                .andExpect(jsonPath("$.features[0].title").value("First feature"))
                .andExpect(jsonPath("$.development[0].items[0]").value("First API"))
                .andExpect(jsonPath("$.architecture.services[0]").value("First service"))
                .andExpect(jsonPath("$.engineering[0].solution").value("First solution"));
        assertThat(count("project_contents", projectId)).isOne();

        ActionChallenge update = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(put(PROJECTS_PATH + "/" + projectId + "/content"), update, contentBody("Second"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.results[0].title").value("Second result"));
        assertThat(jdbcTemplate.queryForObject("""
                SELECT results_json->0->>'title' FROM project_contents WHERE project_id = ?
                """, String.class, projectId)).isEqualTo("Second result");

        String checksum = contentChecksum(projectId);
        ActionChallenge invalid = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(put(PROJECTS_PATH + "/" + projectId + "/content"), invalid,
                "{\"results\":[],\"background\":[],\"features\":[],\"development\":[],\"engineering\":[]}")
                .andExpect(status().isBadRequest());
        assertThat(contentChecksum(projectId)).isEqualTo(checksum);
        assertThat(challengeStatus(invalid.id())).isEqualTo("ACTIVE");
    }

    // Technology·Media 전체 교체와 Public Card/Detail·공개 상태 연동 검증
    @Test
    void projectCompositionReplacementAndStatusImmediatelyAffectPublicApis() throws Exception {
        Long projectId = project("public-project", true);
        Long cardTechnology = technology("Card", true);
        Long detailTechnology = technology("Detail", true);
        Long disabledTechnology = technology("Disabled", false);

        ActionChallenge technologies = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(put(PROJECTS_PATH + "/" + projectId + "/technologies"), technologies, """
                {"items":[
                  {"technologyId":%d,"showOnCard":false,"highlighted":true,"displayOrder":2},
                  {"technologyId":%d,"showOnCard":true,"highlighted":false,"displayOrder":0}
                ]}
                """.formatted(detailTechnology, cardTechnology))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].technologyId").value(cardTechnology));
        assertTechnologyFailure(projectId, """
                {"items":[
                  {"technologyId":%d,"showOnCard":true,"highlighted":false,"displayOrder":0},
                  {"technologyId":%d,"showOnCard":false,"highlighted":true,"displayOrder":1}
                ]}
                """.formatted(cardTechnology, cardTechnology), 400);
        assertTechnologyFailure(projectId,
                "{\"items\":[{\"technologyId\":999999,\"showOnCard\":true,\"highlighted\":false,\"displayOrder\":0}]}",
                404);
        assertTechnologyFailure(projectId,
                "{\"items\":[{\"technologyId\":" + disabledTechnology
                        + ",\"showOnCard\":true,\"highlighted\":false,\"displayOrder\":0}]}", 404);
        assertThat(count("project_technologies", projectId)).isEqualTo(2);

        ActionChallenge media = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(put(PROJECTS_PATH + "/" + projectId + "/media"), media, """
                {"items":[
                  {"imageUrl":"projects/%d/carousel/later.webp","label":null,"altText":null,"displayOrder":2},
                  {"imageUrl":"projects/%d/carousel/first.webp","label":"first","altText":"alt","displayOrder":0}
                ]}
                """.formatted(projectId, projectId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].mediaType").value("CAROUSEL"))
                .andExpect(jsonPath("$.items[0].imageUrl")
                        .value(org.hamcrest.Matchers.startsWith(
                                "/api/v1/admin/media/projects/" + projectId + "/")));
        String mediaChecksum = mediaChecksum(projectId);
        ActionChallenge invalidMedia = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(put(PROJECTS_PATH + "/" + projectId + "/media"), invalidMedia,
                "{\"items\":[{\"imageUrl\":\" \",\"displayOrder\":0}]}")
                .andExpect(status().isBadRequest());
        assertThat(mediaChecksum(projectId)).isEqualTo(mediaChecksum);

        mockMvc.perform(get("/api/v1/public/portfolio"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.projects[0].technologies.length()").value(1))
                .andExpect(jsonPath("$.projects[0].technologies[0].name").value("Card"));
        mockMvc.perform(get("/api/v1/public/projects/public-project"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.technologies.length()").value(2))
                .andExpect(jsonPath("$.technologies[1].highlighted").value(true))
                .andExpect(jsonPath("$.media.length()").value(2));

        ActionChallenge off = challenge("PROJECT_STATUS_UPDATE", "PROJECT", projectId.toString());
        change(patch(PROJECTS_PATH + "/" + projectId + "/status"), off, "{\"enabled\":false}")
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/public/portfolio"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.projects.length()").value(0));
        mockMvc.perform(get("/api/v1/public/projects/public-project")).andExpect(status().isNotFound());
        ActionChallenge on = challenge("PROJECT_STATUS_UPDATE", "PROJECT", projectId.toString());
        change(patch(PROJECTS_PATH + "/" + projectId + "/status"), on, "{\"enabled\":true}")
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/v1/public/projects/public-project")).andExpect(status().isOk());

        ActionChallenge clearTechnology = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(put(PROJECTS_PATH + "/" + projectId + "/technologies"), clearTechnology, "{\"items\":[]}")
                .andExpect(status().isOk());
        ActionChallenge clearMedia = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(put(PROJECTS_PATH + "/" + projectId + "/media"), clearMedia, "{\"items\":[]}")
                .andExpect(status().isOk());
        assertThat(count("project_technologies", projectId)).isZero();
        assertThat(count("project_media", projectId)).isZero();
    }

    private ResultActions create(
            ActionChallenge challenge,
            String body,
            org.springframework.test.web.servlet.request.RequestPostProcessor principal,
            boolean withCsrf
    ) throws Exception {
        var request = post(PROJECTS_PATH).with(principal).headers(actionHeaders(challenge))
                .contentType(MediaType.APPLICATION_JSON).content(body);
        if (withCsrf) {
            request.with(csrf());
        }
        return mockMvc.perform(request);
    }

    private ResultActions change(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
            ActionChallenge challenge,
            String body
    ) throws Exception {
        request.with(admin()).with(csrf()).headers(actionHeaders(challenge));
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mockMvc.perform(request);
    }

    private void assertTechnologyFailure(Long projectId, String body, int expectedStatus) throws Exception {
        String checksum = technologyChecksum(projectId);
        ActionChallenge challenge = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        change(put(PROJECTS_PATH + "/" + projectId + "/technologies"), challenge, body)
                .andExpect(status().is(expectedStatus));
        assertThat(technologyChecksum(projectId)).isEqualTo(checksum);
        assertThat(challengeStatus(challenge.id())).isEqualTo("ACTIVE");
    }

    private String createBody(String slug) {
        return """
                {
                  "slug":"%s","name":"Project","year":2026,"tagline":"Tagline",
                  "description":"Description","cardRole":"Backend"
                }
                """.formatted(slug);
    }

    private String contentBody(String prefix) {
        return """
                {
                  "results":[{"title":"%s result","description":"%s description"}],
                  "background":[{"body":"%s background"}],
                  "features":[{"title":"%s feature","description":"%s description"}],
                  "development":[{"title":"Backend","items":["%s API"]}],
                  "architecture":{"services":["%s service"]},
                  "engineering":[{
                    "title":"%s issue","summary":"summary","problem":"problem",
                    "solution":"%s solution","result":"result"
                  }]
                }
                """.formatted(prefix, prefix, prefix, prefix, prefix, prefix, prefix, prefix, prefix);
    }

    private Long project(String slug, boolean enabled) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO projects (slug, name, year, tagline, description, card_role, enabled)
                VALUES (?, 'Original', 2026, 'Tagline', 'Description', 'Backend', ?)
                RETURNING id
                """, Long.class, slug, enabled);
    }

    private Long technology(String name, boolean enabled) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO technology_master (name, category, enabled)
                VALUES (?, 'BACKEND', ?)
                RETURNING id
                """, Long.class, name, enabled);
    }

    private String projectName(Long projectId) {
        return jdbcTemplate.queryForObject("SELECT name FROM projects WHERE id = ?", String.class, projectId);
    }

    private int count(String table, Long projectId) {
        String column = table.equals("projects") ? "id" : "project_id";
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM " + table + " WHERE " + column + " = ?",
                Integer.class,
                projectId
        );
    }

    private String contentChecksum(Long projectId) {
        return jdbcTemplate.queryForObject("""
                SELECT md5(results_json::text || background_json::text || features_json::text
                    || development_json::text || architecture_json::text || engineering_json::text)
                FROM project_contents WHERE project_id = ?
                """, String.class, projectId);
    }

    private String technologyChecksum(Long projectId) {
        return jdbcTemplate.queryForObject("""
                SELECT md5(string_agg(technology_id::text || show_on_card::text
                    || highlighted::text || display_order::text, ',' ORDER BY technology_id))
                FROM project_technologies WHERE project_id = ?
                """, String.class, projectId);
    }

    private String mediaChecksum(Long projectId) {
        return jdbcTemplate.queryForObject("""
                SELECT md5(string_agg(storage_key || media_type || coalesce(label, '')
                    || coalesce(alt_text, '') || display_order::text, ',' ORDER BY display_order, id))
                FROM project_media WHERE project_id = ?
                """, String.class, projectId);
    }
}
