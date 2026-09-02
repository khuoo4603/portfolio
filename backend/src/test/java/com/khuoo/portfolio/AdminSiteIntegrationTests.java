package com.khuoo.portfolio;

import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.util.Arrays;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// 관리자 Site 통합 조회와 Content·Profile·Technology·External Link 변경 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
class AdminSiteIntegrationTests extends SiteIntegrationTestSupport {

    private static final String SITE_PATH = "/api/v1/admin/site";

    @Autowired
    private MockMvc mockMvc;

    // 관리자 Site 조회 권한과 고정 Content Batch 원자성·Challenge 재사용 검증
    @Test
    void siteAccessAndPortfolioContentBatchAreProtectedAndAtomic() throws Exception {
        jdbcTemplate.update("""
                INSERT INTO portfolio_contents (category, content_code, content_value)
                VALUES ('COMMON', 'POSITION', 'old position'), ('CONTACT', 'EMAIL', 'old@example.com')
                """);
        mockMvc.perform(get(SITE_PATH)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(SITE_PATH).with(user())).andExpect(status().isForbidden());
        insertProject("site-response-project");
        mockMvc.perform(get(SITE_PATH).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.portfolioContents.length()").value(2))
                .andExpect(jsonPath("$.projects").doesNotExist());

        ActionChallenge csrfChallenge = challenge("PORTFOLIO_CONTENT_UPDATE", "PORTFOLIO_CONTENT", null);
        updateContents(csrfChallenge, validContentBody(), false).andExpect(status().isForbidden());
        assertThat(contentValue("COMMON", "POSITION")).isEqualTo("old position");

        ActionChallenge valid = challenge("PORTFOLIO_CONTENT_UPDATE", "PORTFOLIO_CONTENT", null);
        updateContents(valid, validContentBody(), true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2));
        assertThat(contentValue("COMMON", "POSITION")).isEqualTo("new position");
        assertThat(contentValue("CONTACT", "EMAIL")).isEqualTo("new@example.com");
        updateContents(valid, validContentBody(), true).andExpect(status().isForbidden());

        assertInvalidContentBatch("""
                {"items":[
                  {"category":"COMMON","contentCode":"POSITION","contentValue":"a"},
                  {"category":"COMMON","contentCode":"POSITION","contentValue":"b"}
                ]}
                """);
        assertInvalidContentBatch("""
                {"items":[{"category":"MAIN","contentCode":"POSITION","contentValue":"bad"}]}
                """);
        assertInvalidContentBatch("""
                {"items":[{"category":"UNKNOWN","contentCode":"POSITION","contentValue":"bad"}]}
                """);
        assertInvalidContentBatch("""
                {"items":[{"category":"COMMON","contentCode":"UNKNOWN","contentValue":"bad"}]}
                """);
        assertInvalidContentBatch("""
                {"items":[{"category":"COMMON","contentCode":"SITE_MARK","contentValue":"bad"}]}
                """);

        String beforePosition = contentValue("COMMON", "POSITION");
        ActionChallenge missing = challenge("PORTFOLIO_CONTENT_UPDATE", "PORTFOLIO_CONTENT", null);
        updateContents(missing, """
                {"items":[
                  {"category":"COMMON","contentCode":"POSITION","contentValue":"must rollback"},
                  {"category":"COMMON","contentCode":"NAME","contentValue":"missing"}
                ]}
                """, true).andExpect(status().isNotFound());
        assertThat(contentValue("COMMON", "POSITION")).isEqualTo(beforePosition);
        assertThat(challengeStatus(missing.id())).isEqualTo("ACTIVE");
    }

    // 최종 16개 콘텐츠 Slot 전체 수정과 Category 매핑 검증
    @Test
    void everyPortfolioContentSlotCanBeUpdated() throws Exception {
        for (PortfolioContentCode contentCode : PortfolioContentCode.values()) {
            jdbcTemplate.update("""
                    INSERT INTO portfolio_contents (category, content_code, content_value)
                    VALUES (?, ?, ?)
                    """, contentCode.category().name(), contentCode.name(), "before-" + contentCode.name());
        }
        String body = Arrays.stream(PortfolioContentCode.values())
                .map(contentCode -> """
                        {"category":"%s","contentCode":"%s","contentValue":"after-%s"}
                        """.formatted(contentCode.category(), contentCode, contentCode))
                .collect(Collectors.joining(",", "{\"items\":[", "]}"));

        ActionChallenge challenge = challenge("PORTFOLIO_CONTENT_UPDATE", "PORTFOLIO_CONTENT", null);
        updateContents(challenge, body, true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(16));

        assertThat(jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM portfolio_contents WHERE content_value LIKE 'after-%'",
                Integer.class
        )).isEqualTo(16);
    }

    // Profile 생성·PATCH Presence·explicit null·빈 PATCH·삭제 검증
    @Test
    void profileCrudDistinguishesExplicitNullAndEmptyPatch() throws Exception {
        ActionChallenge create = challenge("PROFILE_ENTRY_CREATE", "PROFILE_ENTRY", null);
        Long entryId = objectMapper.readTree(profileRequest(post(SITE_PATH + "/profile-entries"), create, """
                        {
                          "entryType":"EDUCATION","periodText":"2023 ~ 2026","title":"School",
                          "organization":"Org","description":"Description",
                          "displayOrder":1,"enabled":true
                        }
                        """)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString()).get("id").asLong();

        ActionChallenge patch = challenge("PROFILE_ENTRY_UPDATE", "PROFILE_ENTRY", entryId.toString());
        profileRequest(patch(SITE_PATH + "/profile-entries/" + entryId), patch,
                "{\"periodText\":null,\"description\":null,\"displayOrder\":7,\"enabled\":false}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.periodText").value((Object) null))
                .andExpect(jsonPath("$.description").value((Object) null))
                .andExpect(jsonPath("$.organization").value("Org"))
                .andExpect(jsonPath("$.displayOrder").value(7))
                .andExpect(jsonPath("$.enabled").value(false))
                .andExpect(jsonPath("$.featured").doesNotExist());

        ActionChallenge empty = challenge("PROFILE_ENTRY_UPDATE", "PROFILE_ENTRY", entryId.toString());
        profileRequest(patch(SITE_PATH + "/profile-entries/" + entryId), empty, "{}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_VALIDATION_ERROR"));
        assertThat(challengeStatus(empty.id())).isEqualTo("ACTIVE");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT title FROM profile_entries WHERE id = ?", String.class, entryId)).isEqualTo("School");

        ActionChallenge delete = challenge("PROFILE_ENTRY_DELETE", "PROFILE_ENTRY", entryId.toString());
        profileRequest(delete(SITE_PATH + "/profile-entries/" + entryId), delete, null)
                .andExpect(status().isNoContent());
        assertThat(count("profile_entries")).isZero();
    }

    // 프로필 5개 유형과 노출·표시 순서 저장 계약 검증
    @Test
    void profileCreateSupportsEveryEntryTypeAndDisplayState() throws Exception {
        String[] entryTypes = {"EDUCATION", "EXPERIENCE", "ACTIVITY", "AWARD", "CERTIFICATE"};

        for (int index = 0; index < entryTypes.length; index++) {
            String entryType = entryTypes[index];
            boolean enabled = index % 2 != 0;
            ActionChallenge challenge = challenge("PROFILE_ENTRY_CREATE", "PROFILE_ENTRY", null);

            profileRequest(post(SITE_PATH + "/profile-entries"), challenge, """
                            {
                              "entryType":"%s","title":"%s item",
                              "displayOrder":%d,"enabled":%s
                            }
                            """.formatted(entryType, entryType, index + 1, enabled))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.entryType").value(entryType))
                    .andExpect(jsonPath("$.displayOrder").value(index + 1))
                    .andExpect(jsonPath("$.enabled").value(enabled))
                    .andExpect(jsonPath("$.featured").doesNotExist());
        }

        assertThat(jdbcTemplate.queryForList("""
                SELECT entry_type
                FROM profile_entries
                ORDER BY display_order
                """, String.class)).containsExactly(entryTypes);
    }

    // Technology CRUD·UNIQUE·Mapping 검증·FK Cascade와 전체 교체 검증
    @Test
    void technologyCrudAndPortfolioMappingPreserveValidConfiguration() throws Exception {
        Long javaId = createTechnology("Java", "LANGUAGE", true);
        Long disabledId = createTechnology("Disabled", "BACKEND", false);

        ActionChallenge duplicate = challenge("TECHNOLOGY_CREATE", "TECHNOLOGY", null);
        technologyRequest(post(SITE_PATH + "/technologies"), duplicate,
                "{\"name\":\"Java\",\"category\":\"LANGUAGE\"}")
                .andExpect(status().isConflict());
        assertThat(challengeStatus(duplicate.id())).isEqualTo("ACTIVE");

        ActionChallenge emptyPatch = challenge("TECHNOLOGY_UPDATE", "TECHNOLOGY", javaId.toString());
        technologyRequest(patch(SITE_PATH + "/technologies/" + javaId), emptyPatch, "{}")
                .andExpect(status().isBadRequest());
        assertThat(challengeStatus(emptyPatch.id())).isEqualTo("ACTIVE");

        ActionChallenge patch = challenge("TECHNOLOGY_UPDATE", "TECHNOLOGY", javaId.toString());
        technologyRequest(patch(SITE_PATH + "/technologies/" + javaId), patch,
                "{\"iconUrl\":null,\"category\":\"BACKEND\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.category").value("BACKEND"))
                .andExpect(jsonPath("$.iconUrl").value((Object) null));

        ActionChallenge replace = challenge(
                "PORTFOLIO_TECHNOLOGY_UPDATE", "PORTFOLIO_TECHNOLOGY", null);
        portfolioTechnologyRequest(replace,
                "{\"items\":[{\"technologyId\":" + javaId + ",\"displayOrder\":2}]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].technologyId").value(javaId));
        assertThat(mappingChecksum()).isEqualTo(javaId + ":2");

        assertMappingFailure("{\"items\":[{\"technologyId\":" + javaId
                + ",\"displayOrder\":0},{\"technologyId\":" + javaId + ",\"displayOrder\":1}]}", 400);
        assertMappingFailure("{\"items\":[{\"technologyId\":999999,\"displayOrder\":0}]}", 404);
        assertMappingFailure("{\"items\":[{\"technologyId\":" + disabledId + ",\"displayOrder\":0}]}", 404);
        assertThat(mappingChecksum()).isEqualTo(javaId + ":2");

        ActionChallenge clear = challenge(
                "PORTFOLIO_TECHNOLOGY_UPDATE", "PORTFOLIO_TECHNOLOGY", null);
        portfolioTechnologyRequest(clear, "{\"items\":[]}").andExpect(status().isOk());
        assertThat(count("portfolio_technologies")).isZero();
        jdbcTemplate.update("INSERT INTO portfolio_technologies VALUES (?, 0)", javaId);
        Long projectId = insertProject("cascade-project");
        jdbcTemplate.update("INSERT INTO project_technologies VALUES (?, ?, TRUE, FALSE, 0)", projectId, javaId);

        ActionChallenge delete = challenge("TECHNOLOGY_DELETE", "TECHNOLOGY", javaId.toString());
        technologyRequest(delete(SITE_PATH + "/technologies/" + javaId), delete, null)
                .andExpect(status().isNoContent());
        assertThat(count("portfolio_technologies")).isZero();
        assertThat(count("project_technologies")).isZero();
    }

    // Technology 허용 Category 밖 요청과 Challenge 미소모 검증
    @Test
    void technologyCreateRejectsUnknownCategory() throws Exception {
        ActionChallenge challenge = challenge("TECHNOLOGY_CREATE", "TECHNOLOGY", null);

        technologyRequest(post(SITE_PATH + "/technologies"), challenge,
                "{\"name\":\"Invalid\",\"category\":\"OTHER\",\"enabled\":true}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("COMMON_VALIDATION_ERROR"));

        assertThat(challengeStatus(challenge.id())).isEqualTo("ACTIVE");
        assertThat(count("technology_master")).isZero();
    }

    // External Link URL Scheme 정책과 CRUD·빈 PATCH Challenge 미소모 검증
    @Test
    void externalLinkCrudAllowsOnlyHttpAndHttps() throws Exception {
        Long httpId = createLink("HTTP", "http://example.com");
        Long httpsId = createLink("HTTPS", "https://example.com/path");
        assertThat(count("external_links")).isEqualTo(2);
        for (String url : new String[]{
                "mailto:test@example.com", "javascript:alert(1)", "data:text/plain,a", "/relative/path"
        }) {
            ActionChallenge invalid = challenge("EXTERNAL_LINK_CREATE", "EXTERNAL_LINK", null);
            linkRequest(post(SITE_PATH + "/external-links"), invalid,
                    "{\"name\":\"Invalid\",\"url\":\"" + url + "\"}")
                    .andExpect(status().isBadRequest());
            assertThat(challengeStatus(invalid.id())).isEqualTo("ACTIVE");
        }

        ActionChallenge patch = challenge("EXTERNAL_LINK_UPDATE", "EXTERNAL_LINK", httpId.toString());
        linkRequest(patch(SITE_PATH + "/external-links/" + httpId), patch,
                "{\"name\":\"Updated\",\"url\":\"https://updated.example\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"));
        ActionChallenge empty = challenge("EXTERNAL_LINK_UPDATE", "EXTERNAL_LINK", httpId.toString());
        linkRequest(patch(SITE_PATH + "/external-links/" + httpId), empty, "{}")
                .andExpect(status().isBadRequest());
        assertThat(challengeStatus(empty.id())).isEqualTo("ACTIVE");

        ActionChallenge delete = challenge("EXTERNAL_LINK_DELETE", "EXTERNAL_LINK", httpsId.toString());
        linkRequest(delete(SITE_PATH + "/external-links/" + httpsId), delete, null)
                .andExpect(status().isNoContent());
        assertThat(count("external_links")).isOne();
    }

    private ResultActions updateContents(ActionChallenge challenge, String body, boolean withCsrf) throws Exception {
        var request = patch(SITE_PATH + "/portfolio-contents")
                .with(admin()).headers(actionHeaders(challenge))
                .contentType(MediaType.APPLICATION_JSON).content(body);
        if (withCsrf) {
            request.with(csrf());
        }
        return mockMvc.perform(request);
    }

    private void assertInvalidContentBatch(String body) throws Exception {
        ActionChallenge challenge = challenge("PORTFOLIO_CONTENT_UPDATE", "PORTFOLIO_CONTENT", null);
        updateContents(challenge, body, true).andExpect(status().isBadRequest());
        assertThat(challengeStatus(challenge.id())).isEqualTo("ACTIVE");
    }

    private ResultActions profileRequest(
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

    private ResultActions technologyRequest(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
            ActionChallenge challenge,
            String body
    ) throws Exception {
        return profileRequest(request, challenge, body);
    }

    private ResultActions linkRequest(
            org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
            ActionChallenge challenge,
            String body
    ) throws Exception {
        return profileRequest(request, challenge, body);
    }

    private ResultActions portfolioTechnologyRequest(ActionChallenge challenge, String body) throws Exception {
        return mockMvc.perform(put(SITE_PATH + "/portfolio-technologies")
                .with(admin()).with(csrf()).headers(actionHeaders(challenge))
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private Long createTechnology(String name, String category, boolean enabled) throws Exception {
        ActionChallenge challenge = challenge("TECHNOLOGY_CREATE", "TECHNOLOGY", null);
        String response = technologyRequest(post(SITE_PATH + "/technologies"), challenge,
                "{\"name\":\"" + name + "\",\"category\":\"" + category
                        + "\",\"iconUrl\":\"/icon.svg\",\"enabled\":" + enabled + "}")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private Long createLink(String name, String url) throws Exception {
        ActionChallenge challenge = challenge("EXTERNAL_LINK_CREATE", "EXTERNAL_LINK", null);
        String response = linkRequest(post(SITE_PATH + "/external-links"), challenge,
                "{\"name\":\"" + name + "\",\"url\":\"" + url + "\"}")
                .andExpect(status().isCreated()).andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(response).get("id").asLong();
    }

    private void assertMappingFailure(String body, int expectedStatus) throws Exception {
        ActionChallenge challenge = challenge(
                "PORTFOLIO_TECHNOLOGY_UPDATE", "PORTFOLIO_TECHNOLOGY", null);
        portfolioTechnologyRequest(challenge, body).andExpect(status().is(expectedStatus));
        assertThat(challengeStatus(challenge.id())).isEqualTo("ACTIVE");
    }

    private String validContentBody() {
        return """
                {"items":[
                  {"category":"COMMON","contentCode":"POSITION","contentValue":"new position"},
                  {"category":"CONTACT","contentCode":"EMAIL","contentValue":"new@example.com"}
                ]}
                """;
    }

    private String contentValue(String category, String contentCode) {
        return jdbcTemplate.queryForObject("""
                SELECT content_value FROM portfolio_contents
                WHERE category = ? AND content_code = ?
                """, String.class, category, contentCode);
    }

    private String mappingChecksum() {
        return jdbcTemplate.queryForObject("""
                SELECT string_agg(technology_id::text || ':' || display_order::text, ',' ORDER BY display_order)
                FROM portfolio_technologies
                """, String.class);
    }

    private Long insertProject(String slug) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO projects (slug, name, year, tagline, description, card_role)
                VALUES (?, ?, 2026, 'tagline', 'description', 'Backend')
                RETURNING id
                """, Long.class, slug, slug);
    }

    private int count(String table) {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM " + table, Integer.class);
    }
}
