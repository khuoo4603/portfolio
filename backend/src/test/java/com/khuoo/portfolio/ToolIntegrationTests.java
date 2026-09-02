package com.khuoo.portfolio;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.file.service.FileStorageService;
import com.khuoo.portfolio.tool.domain.ToolLink;
import com.khuoo.portfolio.tool.repository.ToolRepository;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Comparator;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Tool Registry와 Links 사용자·관리자 API 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
class ToolIntegrationTests extends SiteIntegrationTestSupport {

    private static final String TOOLS_PATH = "/api/v1/tools";
    private static final String LINKS_PATH = "/api/v1/tools/links";
    private static final String ADMIN_TOOLS_PATH = "/api/v1/admin/tools";
    private static final byte[] JPEG = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0x01};
    private static final byte[] PNG = {
            (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01
    };
    private static final byte[] WEBP = {
            0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
    };
    private static final Path STORAGE_ROOT;

    static {
        try {
            STORAGE_ROOT = Files.createTempDirectory("portfolio-tool-links-test-").toAbsolutePath().normalize();
        } catch (IOException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @MockitoSpyBean
    private ToolRepository toolRepository;

    @MockitoSpyBean
    private FileStorageService fileStorageService;

    // Test 전용 Tool Link Storage Root 등록
    @DynamicPropertySource
    static void storageProperties(DynamicPropertyRegistry registry) {
        registry.add("portfolio.file.storage-root", STORAGE_ROOT::toString);
    }

    // Test별 Tool Repository Spy와 이미지 파일 초기화
    @BeforeEach
    void clearToolLinkStorage() throws IOException {
        Mockito.reset(toolRepository);
        Mockito.reset(fileStorageService);
        try (var paths = Files.walk(STORAGE_ROOT)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                if (!path.equals(STORAGE_ROOT)) {
                    Files.deleteIfExists(path);
                }
            }
        }
    }

    // Test 종료 후 전용 Tool Link Storage 제거
    @AfterAll
    static void deleteToolLinkStorage() throws IOException {
        if (!Files.exists(STORAGE_ROOT)) {
            return;
        }
        try (var paths = Files.walk(STORAGE_ROOT)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                Files.deleteIfExists(path);
            }
        }
    }

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

    // 활성 Link 전체 목록·표시 순서와 LINKS 비활성 직접 접근 차단 검증
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
                .andExpect(jsonPath("$.items[*].id", contains(
                        first.intValue(), middle.intValue(), later.intValue())));

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

    // Tool ON/OFF의 ADMIN Role·CSRF·존재와 재인증 미사용 검증
    @Test
    void toolStatusChangeUsesJsonWithoutAdminAction() throws Exception {
        mockMvc.perform(patch(ADMIN_TOOLS_PATH + "/QUIZ").with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());
        assertThat(toolEnabled("QUIZ")).isTrue();

        mockMvc.perform(patch(ADMIN_TOOLS_PATH + "/QUIZ").with(user()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isForbidden());

        mockMvc.perform(patch(ADMIN_TOOLS_PATH + "/UNKNOWN").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch(ADMIN_TOOLS_PATH + "/QUIZ").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));
        assertThat(toolEnabled("QUIZ")).isFalse();
    }

    // Tool Link DEFAULT·UPLOAD 생성과 Multipart 조합·이미지 검증
    @Test
    void linkCreateSupportsDefaultAndUploadModes() throws Exception {
        jdbcTemplate.update("DELETE FROM tool_links");
        Long defaultId = objectMapper.readTree(linkChange(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", """
                        {"name":"Default","url":"https://example.com","imageMode":"DEFAULT",
                         "category":"MY_SERVICES"}
                        """, null, true)
                        .andExpect(status().isCreated())
                        .andExpect(jsonPath("$.imageUrl").value((Object) null))
                        .andExpect(jsonPath("$.displayOrder").value(0))
                        .andExpect(jsonPath("$.enabled").value(true))
                        .andReturn().getResponse().getContentAsString())
                .get("id").asLong();
        assertThat(linkValue(defaultId, "image_storage_key")).isNull();

        String uploadedBody = linkChange(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", """
                        {"name":"Spring Docs","description":"공식 문서","url":"https://spring.io",
                         "imageMode":"UPLOAD","category":"REFERENCE","displayOrder":10,"enabled":true}
                        """, image("spring.jpeg", "image/jpeg", JPEG), true)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Spring Docs"))
                .andExpect(jsonPath("$.category").value("REFERENCE"))
                .andReturn().getResponse().getContentAsString();
        Long uploadedId = objectMapper.readTree(uploadedBody).get("id").asLong();
        String storageKey = (String) linkValue(uploadedId, "image_storage_key");
        Map<String, Object> saved = jdbcTemplate.queryForMap("SELECT * FROM tool_links WHERE id = ?", uploadedId);
        assertThat(saved)
                .containsEntry("name", "Spring Docs")
                .containsEntry("description", "공식 문서")
                .containsEntry("url", "https://spring.io")
                .containsEntry("category", "REFERENCE")
                .containsEntry("display_order", 10)
                .containsEntry("enabled", true);
        assertThat(storageKey).matches("tools/links/[0-9a-f-]{36}\\.jpg");
        assertThat(Files.readAllBytes(STORAGE_ROOT.resolve(storageKey))).isEqualTo(JPEG);
        assertThat(uploadedBody)
                .contains("/api/v1/tools/media/links/" + uploadedId)
                .doesNotContain(storageKey)
                .doesNotContain(STORAGE_ROOT.toString());
    }

    // Tool Link 생성 Metadata와 이미지 Mode 조합 오류 차단 검증
    @Test
    void linkCreateRejectsInvalidMetadataAndImages() throws Exception {
        String[] invalidBodies = new String[]{
                "{\"url\":\"https://example.com\",\"imageMode\":\"DEFAULT\",\"category\":\"REFERENCE\"}",
                "{\"name\":\" \",\"url\":\"https://example.com\",\"imageMode\":\"DEFAULT\",\"category\":\"REFERENCE\"}",
                "{\"name\":\"Missing URL\",\"imageMode\":\"DEFAULT\",\"category\":\"REFERENCE\"}",
                "{\"name\":\"Invalid URL\",\"url\":\"javascript:alert(1)\",\"imageMode\":\"DEFAULT\",\"category\":\"REFERENCE\"}",
                "{\"name\":\"Invalid Mode\",\"url\":\"https://example.com\",\"imageMode\":\"KEEP\",\"category\":\"REFERENCE\"}",
                "{\"name\":\"Invalid Category\",\"url\":\"https://example.com\",\"imageMode\":\"DEFAULT\",\"category\":\"OTHER\"}",
                "{\"name\":\"%s\",\"url\":\"https://example.com\",\"imageMode\":\"DEFAULT\",\"category\":\"REFERENCE\"}"
                        .formatted("N".repeat(101)),
                "{\"name\":\"Long Description\",\"description\":\"%s\",\"url\":\"https://example.com\",\"imageMode\":\"DEFAULT\",\"category\":\"REFERENCE\"}"
                        .formatted("D".repeat(501))
        };
        for (String body : invalidBodies) {
            linkChange(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", body, null, true)
                    .andExpect(status().isBadRequest());
        }

        String defaultMetadata = """
                {"name":"Default","url":"https://example.com","imageMode":"DEFAULT","category":"REFERENCE"}
                """;
        linkChange(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", defaultMetadata,
                image("unexpected.png", "image/png", PNG), true)
                .andExpect(status().isBadRequest());
        String uploadMetadata = defaultMetadata.replace("DEFAULT", "UPLOAD");
        linkChange(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", uploadMetadata, null, true)
                .andExpect(status().isBadRequest());
        linkChange(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", uploadMetadata,
                image("fake.png", "image/png", "not-png".getBytes(StandardCharsets.UTF_8)), true)
                .andExpect(status().isBadRequest());

        byte[] oversized = new byte[5 * 1024 * 1024 + 1];
        System.arraycopy(PNG, 0, oversized, 0, PNG.length);
        linkChange(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", uploadMetadata,
                image("large.png", "image/png", oversized), true)
                .andExpect(status().isBadRequest());
    }

    // Tool Link KEEP·UPLOAD·DEFAULT와 전달 필드 PATCH 의미 검증
    @Test
    void linkUpdateSupportsImageModesAndPatchValues() throws Exception {
        jdbcTemplate.update("DELETE FROM tool_links");
        Long linkId = createUploadedLink("Original", "original.png", "image/png", PNG);
        jdbcTemplate.update("UPDATE tool_links SET description = 'Original description' WHERE id = ?", linkId);
        String originalKey = (String) linkValue(linkId, "image_storage_key");

        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"name\":\"Updated\",\"imageMode\":\"KEEP\"}", null, true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Updated"))
                .andExpect(jsonPath("$.description").value("Original description"))
                .andExpect(jsonPath("$.imageUrl").value("/api/v1/tools/media/links/" + linkId));
        assertThat(linkValue(linkId, "image_storage_key")).isEqualTo(originalKey);
        assertThat(Files.exists(STORAGE_ROOT.resolve(originalKey))).isTrue();

        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"enabled\":false,\"imageMode\":\"KEEP\"}", null, true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));

        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"enabled\":true,\"imageMode\":\"UPLOAD\"}",
                image("replacement.webp", "image/webp", WEBP), true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(true));
        String replacementKey = (String) linkValue(linkId, "image_storage_key");
        assertThat(replacementKey).matches("tools/links/[0-9a-f-]{36}\\.webp");
        assertThat(Files.exists(STORAGE_ROOT.resolve(replacementKey))).isTrue();
        assertThat(Files.exists(STORAGE_ROOT.resolve(originalKey))).isFalse();

        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"imageMode\":\"DEFAULT\"}", null, true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value((Object) null));
        assertThat(linkValue(linkId, "image_storage_key")).isNull();
        assertThat(Files.exists(STORAGE_ROOT.resolve(replacementKey))).isFalse();

        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"imageMode\":\"KEEP\"}", null, true)
                .andExpect(status().isBadRequest());
        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"name\":\"Invalid Image\",\"imageMode\":\"KEEP\"}",
                image("unexpected.png", "image/png", PNG), true)
                .andExpect(status().isBadRequest());
        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"imageMode\":\"DEFAULT\"}", image("unexpected.png", "image/png", PNG), true)
                .andExpect(status().isBadRequest());
        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"imageMode\":\"UPLOAD\"}", null, true)
                .andExpect(status().isBadRequest());
        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"imageMode\":\"UNKNOWN\"}", null, true)
                .andExpect(status().isBadRequest());
        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/999999",
                "{\"name\":\"Missing\",\"imageMode\":\"KEEP\"}", null, true)
                .andExpect(status().isNotFound());
    }

    // Tool Link 삭제 Commit 후 Custom Image 정리 검증
    @Test
    void linkDeleteRemovesImageAfterCommit() throws Exception {
        Long linkId = createUploadedLink("Delete", "delete.png", "image/png", PNG);
        String storageKey = (String) linkValue(linkId, "image_storage_key");

        mockMvc.perform(delete(ADMIN_TOOLS_PATH + "/links/" + linkId).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        assertThat(linkCount(linkId)).isZero();
        assertThat(Files.exists(STORAGE_ROOT.resolve(storageKey))).isFalse();

        mockMvc.perform(delete(ADMIN_TOOLS_PATH + "/links/" + linkId).with(admin()).with(csrf()))
                .andExpect(status().isNotFound());
    }

    // Tool Link 변경의 ADMIN Role·CSRF 보호와 재인증 미사용 검증
    @Test
    void linkMutationsRequireAdminAndCsrfWithoutAdminAction() throws Exception {
        String metadata = """
                {"name":"Protected","url":"https://example.com","imageMode":"DEFAULT","category":"REFERENCE"}
                """;

        mockMvc.perform(multipart(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links")
                        .file(metadata(metadata)).with(csrf()))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(multipart(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links")
                        .file(metadata(metadata)).with(user()).with(csrf()))
                .andExpect(status().isForbidden());
        linkChange(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", metadata, null, false)
                .andExpect(status().isForbidden());

        Long linkId = objectMapper.readTree(linkChange(
                        HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", metadata, null, true)
                        .andExpect(status().isCreated())
                        .andReturn().getResponse().getContentAsString())
                .get("id").asLong();
        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"enabled\":false,\"imageMode\":\"KEEP\"}", null, true)
                .andExpect(status().isOk());
        mockMvc.perform(delete(ADMIN_TOOLS_PATH + "/links/" + linkId).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
    }

    // Tool Link 이미지 Binary MIME·Cache·Session·활성 상태 검증
    @Test
    void linkMediaServesActiveCustomImagesOnly() throws Exception {
        Long jpegId = createUploadedLink("JPEG", "photo.jpg", "image/jpeg", JPEG);
        Long pngId = createUploadedLink("PNG", "preview.png", "image/png", PNG);
        Long webpId = createUploadedLink("WEBP", "cover.webp", "image/webp", WEBP);

        mockMvc.perform(get(TOOLS_PATH + "/media/links/" + jpegId))
                .andExpect(status().isUnauthorized());
        assertLinkMedia(jpegId, "image/jpeg", JPEG);
        assertLinkMedia(pngId, "image/png", PNG);
        assertLinkMedia(webpId, "image/webp", WEBP);
        mockMvc.perform(get(TOOLS_PATH + "/media/links/" + webpId).with(admin()))
                .andExpect(status().isOk());

        Long defaultId = insertLink("Default", "REFERENCE", 10, true);
        mockMvc.perform(get(TOOLS_PATH + "/media/links/" + defaultId).with(user()))
                .andExpect(status().isNotFound());
        jdbcTemplate.update("UPDATE tool_links SET enabled = FALSE WHERE id = ?", jpegId);
        mockMvc.perform(get(TOOLS_PATH + "/media/links/" + jpegId).with(user()))
                .andExpect(status().isNotFound());
        mockMvc.perform(get(TOOLS_PATH + "/media/links/999999").with(user()))
                .andExpect(status().isNotFound());

        String pngKey = (String) linkValue(pngId, "image_storage_key");
        Files.delete(STORAGE_ROOT.resolve(pngKey));
        mockMvc.perform(get(TOOLS_PATH + "/media/links/" + pngId).with(user()))
                .andExpect(status().isNotFound());

        jdbcTemplate.update("UPDATE tools SET enabled = FALSE WHERE tool_key = 'LINKS'");
        mockMvc.perform(get(TOOLS_PATH + "/media/links/" + webpId).with(user()))
                .andExpect(status().isNotFound());
    }

    // 동일 이미지 304와 Upload 교체 후 새 ETag·Binary 응답 검증
    @Test
    void linkMediaUsesConditionalEtagAndChangesAfterReplacement() throws Exception {
        Long linkId = createUploadedLink("ETag", "original.png", "image/png", PNG);
        String storageKey = (String) linkValue(linkId, "image_storage_key");

        MvcResult first = mockMvc.perform(get(TOOLS_PATH + "/media/links/" + linkId).with(user()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/png"))
                .andExpect(header().string("Cache-Control", containsString("private")))
                .andExpect(header().string("Cache-Control", containsString("no-cache")))
                .andExpect(header().exists(HttpHeaders.ETAG))
                .andExpect(content().bytes(PNG))
                .andReturn();
        String originalEtag = first.getResponse().getHeader(HttpHeaders.ETAG);
        assertThat(originalEtag).isNotBlank().doesNotContain(storageKey);

        mockMvc.perform(get(TOOLS_PATH + "/media/links/" + linkId)
                        .header(HttpHeaders.IF_NONE_MATCH, originalEtag)
                        .with(user()))
                .andExpect(status().isNotModified())
                .andExpect(header().string(HttpHeaders.ETAG, originalEtag))
                .andExpect(content().bytes(new byte[0]));

        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"imageMode\":\"UPLOAD\"}", image("replacement.webp", "image/webp", WEBP), true)
                .andExpect(status().isOk());

        MvcResult replaced = mockMvc.perform(get(TOOLS_PATH + "/media/links/" + linkId)
                        .header(HttpHeaders.IF_NONE_MATCH, originalEtag)
                        .with(user()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/webp"))
                .andExpect(header().exists(HttpHeaders.ETAG))
                .andExpect(content().bytes(WEBP))
                .andReturn();
        assertThat(replaced.getResponse().getHeader(HttpHeaders.ETAG)).isNotEqualTo(originalEtag);
    }

    // Tool Link DB Rollback 시 신규 제거와 기존 값·파일 보존 검증
    @Test
    void linkImageLifecyclePreservesFilesAcrossRollbacks() throws Exception {
        String uploadMetadata = """
                {"name":"Create Failure","url":"https://example.com","imageMode":"UPLOAD","category":"REFERENCE"}
                """;
        doThrow(new ApiException(ErrorCode.COMMON_INTERNAL_ERROR))
                .when(toolRepository).saveLink(any(ToolLink.class));
        linkChange(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", uploadMetadata,
                image("create.png", "image/png", PNG), true)
                .andExpect(status().isInternalServerError());
        assertThat(storageFileCount()).isZero();

        Mockito.reset(toolRepository);
        Long linkId = createUploadedLink("Rollback", "original.png", "image/png", PNG);
        String originalKey = (String) linkValue(linkId, "image_storage_key");

        doThrow(new ApiException(ErrorCode.COMMON_INTERNAL_ERROR)).when(toolRepository).flush();
        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"imageMode\":\"UPLOAD\"}", image("new.webp", "image/webp", WEBP), true)
                .andExpect(status().isInternalServerError());
        assertThat(linkValue(linkId, "image_storage_key")).isEqualTo(originalKey);
        assertThat(Files.exists(STORAGE_ROOT.resolve(originalKey))).isTrue();
        assertThat(storageFileCount()).isOne();

        Mockito.reset(toolRepository);
        doThrow(new ApiException(ErrorCode.COMMON_INTERNAL_ERROR)).when(toolRepository).flush();
        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"imageMode\":\"DEFAULT\"}", null, true)
                .andExpect(status().isInternalServerError());
        assertThat(linkValue(linkId, "image_storage_key")).isEqualTo(originalKey);
        assertThat(Files.exists(STORAGE_ROOT.resolve(originalKey))).isTrue();

        Mockito.reset(toolRepository);
        doThrow(new ApiException(ErrorCode.COMMON_INTERNAL_ERROR)).when(toolRepository).flush();
        mockMvc.perform(delete(ADMIN_TOOLS_PATH + "/links/" + linkId).with(admin()).with(csrf()))
                .andExpect(status().isInternalServerError());
        assertThat(linkCount(linkId)).isOne();
        assertThat(Files.exists(STORAGE_ROOT.resolve(originalKey))).isTrue();
    }

    // Commit 이후 기존 이미지 정리 실패와 DB 변경 성공 유지 검증
    @Test
    void cleanupFailureDoesNotRollbackCommittedLinkChange() throws Exception {
        Long linkId = createUploadedLink("Cleanup", "cleanup.png", "image/png", PNG);
        String storageKey = (String) linkValue(linkId, "image_storage_key");
        doThrow(new ApiException(ErrorCode.COMMON_INTERNAL_ERROR))
                .when(fileStorageService).delete(eq(storageKey));

        linkChange(HttpMethod.PATCH, ADMIN_TOOLS_PATH + "/links/" + linkId,
                "{\"imageMode\":\"DEFAULT\"}", null, true)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value((Object) null));
        assertThat(linkValue(linkId, "image_storage_key")).isNull();
        assertThat(Files.exists(STORAGE_ROOT.resolve(storageKey))).isTrue();
    }

    private ResultActions linkChange(
            HttpMethod method,
            String path,
            String metadata,
            MockMultipartFile image,
            boolean withCsrf
    ) throws Exception {
        var request = multipart(method, path)
                .file(metadata(metadata))
                .with(admin());
        if (image != null) {
            request.file(image);
        }
        if (withCsrf) {
            request.with(csrf());
        }
        return mockMvc.perform(request);
    }

    private MockMultipartFile metadata(String json) {
        return new MockMultipartFile(
                "metadata",
                "metadata.json",
                MediaType.APPLICATION_JSON_VALUE,
                json.getBytes(StandardCharsets.UTF_8)
        );
    }

    private MockMultipartFile image(String name, String contentType, byte[] bytes) {
        return new MockMultipartFile("image", name, contentType, bytes);
    }

    private Long createUploadedLink(String name, String fileName, String contentType, byte[] bytes) throws Exception {
        String body = linkChange(HttpMethod.POST, ADMIN_TOOLS_PATH + "/links", """
                        {"name":"%s","url":"https://example.com/%s","imageMode":"UPLOAD","category":"REFERENCE"}
                        """.formatted(name, name.toLowerCase()), image(fileName, contentType, bytes), true)
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return objectMapper.readTree(body).get("id").asLong();
    }

    private void assertLinkMedia(Long linkId, String contentType, byte[] bytes) throws Exception {
        mockMvc.perform(get(TOOLS_PATH + "/media/links/" + linkId).with(user()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(contentType))
                .andExpect(header().string("Cache-Control", containsString("private")))
                .andExpect(header().string("Cache-Control", containsString("no-cache")))
                .andExpect(header().exists(HttpHeaders.ETAG))
                .andExpect(content().bytes(bytes));
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

    private int storageFileCount() throws IOException {
        try (var paths = Files.walk(STORAGE_ROOT)) {
            return (int) paths.filter(Files::isRegularFile).count();
        }
    }
}
