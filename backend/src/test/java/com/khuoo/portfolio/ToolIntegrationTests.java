package com.khuoo.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Tool Registry와 Links 사용자·관리자 API 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
class ToolIntegrationTests extends SiteIntegrationTestSupport {

    private static final String TOOLS_PATH = "/api/v1/tools";
    private static final String LINKS_PATH = "/api/v1/tools/links";
    private static final String ADMIN_TOOLS_PATH = "/api/v1/admin/tools";

    @Autowired
    private MockMvc mockMvc;

    // Tool 활성 목록 응답 필드와 USER·ADMIN·비로그인 접근 경계 검증
    @Test
    void toolListFiltersDisabledToolsAndEnforcesRoles() throws Exception {
        mockMvc.perform(get(TOOLS_PATH))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get(TOOLS_PATH).with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].toolKey", containsInAnyOrder("QUIZ", "LINKS")))
                .andExpect(jsonPath("$.items[*].name", containsInAnyOrder("Quiz", "Links")))
                .andExpect(jsonPath("$.items[0].enabled").doesNotExist());
        mockMvc.perform(get(TOOLS_PATH).with(admin()))
                .andExpect(status().isOk());

        jdbcTemplate.update("UPDATE tools SET enabled = FALSE WHERE tool_key = 'LINKS'");
        mockMvc.perform(get(TOOLS_PATH).with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].toolKey").value("QUIZ"))
                .andExpect(jsonPath("$.items[0].name").value("Quiz"));
    }

    // 활성 Link 필터·표시 순서·Category와 LINKS 비활성 직접 접근 차단 검증
    @Test
    void linkListFiltersOrdersCategoriesAndRequiresEnabledTool() throws Exception {
        jdbcTemplate.update("DELETE FROM tool_links");
        Long later = insertLink("Later", "REFERENCE", 20, true);
        Long first = insertLink("First", "MY_SERVICES", 1, true);
        Long middle = insertLink("Middle", "REFERENCE", 10, true);
        insertLink("Hidden", "REFERENCE", 0, false);

        mockMvc.perform(get(LINKS_PATH))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get(LINKS_PATH).with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", contains(
                        first.intValue(), middle.intValue(), later.intValue())))
                .andExpect(jsonPath("$.items[0].displayOrder").doesNotExist())
                .andExpect(jsonPath("$.items[0].enabled").doesNotExist());
        mockMvc.perform(get(LINKS_PATH).with(admin()))
                .andExpect(status().isOk());

        mockMvc.perform(get(LINKS_PATH).with(user()).param("category", "REFERENCE"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", contains(middle.intValue(), later.intValue())));
        mockMvc.perform(get(LINKS_PATH).with(user()).param("category", "MY_SERVICES"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.items[0].id").value(first));
        mockMvc.perform(get(LINKS_PATH).with(user()).param("category", "UNKNOWN"))
                .andExpect(status().isBadRequest());

        jdbcTemplate.update("UPDATE tools SET enabled = FALSE WHERE tool_key = 'LINKS'");
        mockMvc.perform(get(LINKS_PATH).with(user()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get(LINKS_PATH).with(user()).param("category", "REFERENCE"))
                .andExpect(status().isNotFound());
    }

    // 관리자 통합 조회의 비활성 Tool·Link 포함과 Role 경계 검증
    @Test
    void adminToolsIncludesDisabledDataWithoutActionChallenge() throws Exception {
        jdbcTemplate.update("DELETE FROM tool_links");
        Long enabledLink = insertLink("Enabled", "REFERENCE", 1, true);
        Long disabledLink = insertLink("Disabled", "MY_SERVICES", 2, false);
        jdbcTemplate.update("UPDATE tools SET enabled = FALSE WHERE tool_key = 'LINKS'");

        mockMvc.perform(get(ADMIN_TOOLS_PATH))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get(ADMIN_TOOLS_PATH).with(user()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(ADMIN_TOOLS_PATH).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.tools[*].toolKey", containsInAnyOrder("QUIZ", "LINKS")))
                .andExpect(jsonPath("$.tools[*].enabled", containsInAnyOrder(true, false)))
                .andExpect(jsonPath("$.links[*].id", contains(enabledLink.intValue(), disabledLink.intValue())))
                .andExpect(jsonPath("$.links[*].displayOrder", contains(1, 2)))
                .andExpect(jsonPath("$.links[*].enabled", contains(true, false)));
    }

    // Tool ON/OFF의 CSRF·존재·Challenge 바인딩·1회 소모 검증
    @Test
    void toolStatusChangeRequiresCsrfAndBoundChallenge() throws Exception {
        ActionChallenge csrfChallenge = challenge("TOOL_STATUS_UPDATE", "TOOL", "QUIZ");
        change(patch(ADMIN_TOOLS_PATH + "/QUIZ"), csrfChallenge, "{\"enabled\":false}", false)
                .andExpect(status().isForbidden());
        assertThat(toolEnabled("QUIZ")).isTrue();
        assertThat(challengeStatus(csrfChallenge.id())).isEqualTo("ACTIVE");

        mockMvc.perform(patch(ADMIN_TOOLS_PATH + "/QUIZ").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isBadRequest());
        ActionChallenge userChallenge = challenge("TOOL_STATUS_UPDATE", "TOOL", "QUIZ");
        mockMvc.perform(patch(ADMIN_TOOLS_PATH + "/QUIZ").with(user()).with(csrf())
                        .headers(actionHeaders(userChallenge))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());

        ActionChallenge missing = challenge("TOOL_STATUS_UPDATE", "TOOL", "UNKNOWN");
        change(patch(ADMIN_TOOLS_PATH + "/UNKNOWN"), missing, "{\"enabled\":false}", true)
                .andExpect(status().isNotFound());
        assertThat(challengeStatus(missing.id())).isEqualTo("ACTIVE");

        ActionChallenge mismatch = challenge("TOOL_STATUS_UPDATE", "TOOL", "LINKS");
        change(patch(ADMIN_TOOLS_PATH + "/QUIZ"), mismatch, "{\"enabled\":false}", true)
                .andExpect(status().isForbidden());
        assertThat(toolEnabled("QUIZ")).isTrue();

        ActionChallenge quizOff = challenge("TOOL_STATUS_UPDATE", "TOOL", "QUIZ");
        change(patch(ADMIN_TOOLS_PATH + "/QUIZ"), quizOff, "{\"enabled\":false}", true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
        assertThat(toolEnabled("QUIZ")).isFalse();
        assertThat(challengeStatus(quizOff.id())).isEqualTo("USED");
        change(patch(ADMIN_TOOLS_PATH + "/QUIZ"), quizOff, "{\"enabled\":true}", true)
                .andExpect(status().isForbidden());
        assertThat(toolEnabled("QUIZ")).isFalse();

        ActionChallenge quizOn = challenge("TOOL_STATUS_UPDATE", "TOOL", "QUIZ");
        change(patch(ADMIN_TOOLS_PATH + "/QUIZ"), quizOn, "{\"enabled\":true}", true)
                .andExpect(status().isOk());
        ActionChallenge linksOff = challenge("TOOL_STATUS_UPDATE", "TOOL", "LINKS");
        change(patch(ADMIN_TOOLS_PATH + "/LINKS"), linksOff, "{\"enabled\":false}", true)
                .andExpect(status().isOk());
        assertThat(toolEnabled("QUIZ")).isTrue();
        assertThat(toolEnabled("LINKS")).isFalse();
    }

    // Tool Link 생성값·기본값·입력 Validation과 DB 저장 검증
    @Test
    void linkCreatePersistsValuesDefaultsAndValidation() throws Exception {
        jdbcTemplate.update("DELETE FROM tool_links");
        ActionChallenge full = challenge("TOOL_LINK_CREATE", "TOOL_LINK", null);
        Long fullId = objectMapper.readTree(change(post(ADMIN_TOOLS_PATH + "/links"), full, """
                        {
                          "name":"Spring Docs","description":"공식 문서",
                          "url":"https://spring.io","imageUrl":"/images/spring.webp",
                          "category":"REFERENCE","displayOrder":10,"enabled":true
                        }
                        """, true)
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.name").value("Spring Docs"))
                        .andExpect(jsonPath("$.category").value("REFERENCE"))
                        .andExpect(jsonPath("$.displayOrder").value(10))
                        .andExpect(jsonPath("$.enabled").value(true))
                        .andReturn().getResponse().getContentAsString())
                .get("id").asLong();
        Map<String, Object> saved = jdbcTemplate.queryForMap("SELECT * FROM tool_links WHERE id = ?", fullId);
        assertThat(saved)
                .containsEntry("name", "Spring Docs")
                .containsEntry("description", "공식 문서")
                .containsEntry("url", "https://spring.io")
                .containsEntry("image_storage_key", "/images/spring.webp")
                .containsEntry("category", "REFERENCE")
                .containsEntry("display_order", 10)
                .containsEntry("enabled", true);

        ActionChallenge defaults = challenge("TOOL_LINK_CREATE", "TOOL_LINK", null);
        change(post(ADMIN_TOOLS_PATH + "/links"), defaults, """
                {"name":"Default","url":"https://example.com","category":"MY_SERVICES"}
                """, true)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.displayOrder").value(0))
                .andExpect(jsonPath("$.enabled").value(true));

        ActionChallenge invalid = challenge("TOOL_LINK_CREATE", "TOOL_LINK", null);
        String[] invalidBodies = new String[]{
                "{\"url\":\"https://example.com\",\"category\":\"REFERENCE\"}",
                "{\"name\":\" \",\"url\":\"https://example.com\",\"category\":\"REFERENCE\"}",
                "{\"name\":\"Missing URL\",\"category\":\"REFERENCE\"}",
                "{\"name\":\"Invalid URL\",\"url\":\"javascript:alert(1)\",\"category\":\"REFERENCE\"}",
                "{\"name\":\"Invalid Category\",\"url\":\"https://example.com\",\"category\":\"OTHER\"}",
                "{\"name\":\"%s\",\"url\":\"https://example.com\",\"category\":\"REFERENCE\"}"
                        .formatted("N".repeat(101)),
                "{\"name\":\"Long Description\",\"description\":\"%s\",\"url\":\"https://example.com\",\"category\":\"REFERENCE\"}"
                        .formatted("D".repeat(501))
        };
        for (String body : invalidBodies) {
            change(post(ADMIN_TOOLS_PATH + "/links"), invalid, body, true)
                    .andExpect(status().isBadRequest());
        }
        assertThat(challengeStatus(invalid.id())).isEqualTo("ACTIVE");
    }

    // Tool Link PATCH Presence·활성/순서 변경과 삭제 Challenge 바인딩 검증
    @Test
    void linkUpdateAndDeletePreservePatchMeaningAndOwnershipBinding() throws Exception {
        jdbcTemplate.update("DELETE FROM tool_links");
        Long linkId = insertLink("Original", "REFERENCE", 20, true);
        jdbcTemplate.update("UPDATE tool_links SET description = 'Original description', image_storage_key = '/original.webp' WHERE id = ?",
                linkId);

        ActionChallenge rename = challenge("TOOL_LINK_UPDATE", "TOOL_LINK", linkId.toString());
        change(patch(ADMIN_TOOLS_PATH + "/links/" + linkId), rename, "{\"name\":\"Updated\"}", true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"))
                .andExpect(jsonPath("$.description").value("Original description"))
                .andExpect(jsonPath("$.imageUrl").value("/original.webp"));
        assertThat(linkValue(linkId, "image_storage_key")).isEqualTo("/original.webp");

        ActionChallenge clearImage = challenge("TOOL_LINK_UPDATE", "TOOL_LINK", linkId.toString());
        change(patch(ADMIN_TOOLS_PATH + "/links/" + linkId), clearImage, "{\"imageUrl\":null}", true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value((Object) null));
        assertThat(linkValue(linkId, "image_storage_key")).isNull();

        ActionChallenge disable = challenge("TOOL_LINK_UPDATE", "TOOL_LINK", linkId.toString());
        change(patch(ADMIN_TOOLS_PATH + "/links/" + linkId), disable, "{\"enabled\":false}", true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
        ActionChallenge reorder = challenge("TOOL_LINK_UPDATE", "TOOL_LINK", linkId.toString());
        change(patch(ADMIN_TOOLS_PATH + "/links/" + linkId), reorder,
                "{\"enabled\":true,\"displayOrder\":0}", true)
                .andExpect(status().isOk());
        Long otherId = insertLink("Other", "REFERENCE", 10, true);
        mockMvc.perform(get(LINKS_PATH).with(user()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[*].id", contains(linkId.intValue(), otherId.intValue())));

        ActionChallenge empty = challenge("TOOL_LINK_UPDATE", "TOOL_LINK", linkId.toString());
        change(patch(ADMIN_TOOLS_PATH + "/links/" + linkId), empty, "{}", true)
                .andExpect(status().isBadRequest());
        assertThat(challengeStatus(empty.id())).isEqualTo("ACTIVE");
        ActionChallenge missing = challenge("TOOL_LINK_UPDATE", "TOOL_LINK", "999999");
        change(patch(ADMIN_TOOLS_PATH + "/links/999999"), missing, "{\"name\":\"Missing\"}", true)
                .andExpect(status().isNotFound());

        ActionChallenge mismatch = challenge("TOOL_LINK_DELETE", "TOOL_LINK", otherId.toString());
        change(delete(ADMIN_TOOLS_PATH + "/links/" + linkId), mismatch, null, true)
                .andExpect(status().isForbidden());
        assertThat(linkCount(linkId)).isOne();
        ActionChallenge delete = challenge("TOOL_LINK_DELETE", "TOOL_LINK", linkId.toString());
        change(delete(ADMIN_TOOLS_PATH + "/links/" + linkId), delete, null, true)
                .andExpect(status().isNoContent());
        assertThat(linkCount(linkId)).isZero();
        ActionChallenge deleteMissing = challenge("TOOL_LINK_DELETE", "TOOL_LINK", linkId.toString());
        change(delete(ADMIN_TOOLS_PATH + "/links/" + linkId), deleteMissing, null, true)
                .andExpect(status().isNotFound());
    }

    private ResultActions change(
            MockHttpServletRequestBuilder request,
            ActionChallenge challenge,
            String body,
            boolean withCsrf
    ) throws Exception {
        request.with(admin()).headers(actionHeaders(challenge));
        if (withCsrf) {
            request.with(csrf());
        }
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mockMvc.perform(request);
    }

    // Tool Link 조회 Fixture 추가
    private Long insertLink(String name, String category, int displayOrder, boolean enabled) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO tool_links (name, url, category, display_order, enabled)
                VALUES (?, ?, ?, ?, ?)
                RETURNING id
                """, Long.class, name, "https://example.com/" + name.toLowerCase(), category, displayOrder, enabled);
    }

    private boolean toolEnabled(String toolKey) {
        return Boolean.TRUE.equals(jdbcTemplate.queryForObject(
                "SELECT enabled FROM tools WHERE tool_key = ?", Boolean.class, toolKey
        ));
    }

    private Object linkValue(Long linkId, String column) {
        return jdbcTemplate.queryForMap("SELECT image_storage_key, enabled, display_order FROM tool_links WHERE id = ?", linkId)
                .get(column);
    }

    private int linkCount(Long linkId) {
        return jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM tool_links WHERE id = ?", Integer.class, linkId
        );
    }
}
