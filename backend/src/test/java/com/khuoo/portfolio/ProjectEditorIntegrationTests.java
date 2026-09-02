package com.khuoo.portfolio;

import com.khuoo.portfolio.file.service.FileStorageService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Project Editor 통합 저장·미디어·보상 처리 API 검증
@SpringBootTest
@AutoConfigureMockMvc
class ProjectEditorIntegrationTests extends SiteIntegrationTestSupport {

    private static final String PROJECTS_PATH = "/api/v1/admin/projects/";
    private static final Path STORAGE_ROOT = Path.of("build", "test-storage").toAbsolutePath();
    private static final byte[] JPEG = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0x01};
    private static final byte[] PNG = {
            (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
    };
    private static final byte[] WEBP = {
            0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
    };

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private FileStorageService fileStorageService;

    // NULL Draft·6개 JSON 순서·기술 전체 교체·enabled 불변 저장 검증
    @Test
    void saveUpdatesWholeDraftWithSingleChallenge() throws Exception {
        Long projectId = project("editor-draft", false);
        Long technologyId = technology("Editor Java", true);
        ActionChallenge challenge = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());

        String response = save(projectId, draftMetadata("editor-saved", technologyId), challenge)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.project.slug").value("editor-saved"))
                .andExpect(jsonPath("$.project.year").value((Object) null))
                .andExpect(jsonPath("$.project.teamSize").value((Object) null))
                .andExpect(jsonPath("$.project.enabled").value(false))
                .andExpect(jsonPath("$.technologies.length()").value(1))
                .andExpect(jsonPath("$.technologies[0].technologyId").value(technologyId))
                .andExpect(jsonPath("$.content.results[0].title").value("first"))
                .andExpect(jsonPath("$.content.results[1].title").value("second"))
                .andExpect(jsonPath("$.content.architecture.notes[0].title").value("Runtime"))
                .andExpect(jsonPath("$.architectureImageUrl").value((Object) null))
                .andExpect(jsonPath("$.media.length()").value(0))
                .andReturn().getResponse().getContentAsString();

        assertThat(response).doesNotContain("storageKey", "clientKey", "uploadIndex");
        assertThat(challengeStatus(challenge.id())).isEqualTo("USED");
        assertThat(jdbcTemplate.queryForObject(
                "SELECT enabled FROM projects WHERE id = ?", Boolean.class, projectId)).isFalse();
        assertThat(jdbcTemplate.queryForObject(
                "SELECT results_json->0->>'title' FROM project_contents WHERE project_id = ?",
                String.class,
                projectId
        )).isEqualTo("first");
    }

    // Thumbnail·Architecture Image·Carousel 업로드와 교체·삭제·Serving 검증
    @Test
    void imageAndCarouselLifecycleCleansReplacedFiles() throws Exception {
        Long projectId = project("media-draft", false);
        Long technologyId = technology("Media Java", true);
        ActionChallenge uploadChallenge = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        String uploadMetadata = mediaUploadMetadata(technologyId);

        String uploadResponse = save(
                projectId,
                uploadMetadata,
                uploadChallenge,
                image("thumbnail", "thumbnail.webp", "image/webp", WEBP),
                image("architectureImage", "architecture.png", "image/png", PNG),
                image("mediaFiles", "screen.jpg", "image/jpeg", JPEG)
        ).andExpect(status().isOk())
                .andExpect(jsonPath("$.project.thumbnailUrl")
                        .value("/api/v1/admin/media/projects/" + projectId + "/thumbnail"))
                .andExpect(jsonPath("$.architectureImageUrl")
                        .value("/api/v1/admin/media/projects/" + projectId + "/architecture"))
                .andExpect(jsonPath("$.media.length()").value(1))
                .andExpect(jsonPath("$.media[0].mediaType").doesNotExist())
                .andReturn().getResponse().getContentAsString();

        var json = objectMapper.readTree(uploadResponse);
        long carouselId = json.get("media").get(0).get("id").asLong();
        assertThat(uploadResponse).doesNotContain("storageKey", "clientKey", "uploadIndex");

        String oldThumbnailKey = thumbnailKey(projectId);
        String oldArchitectureKey = architectureKey(projectId);
        String carouselKey = mediaKey(carouselId);
        assertThat(fileStorageService.exists(oldThumbnailKey)).isTrue();
        assertThat(fileStorageService.exists(oldArchitectureKey)).isTrue();
        assertThat(fileStorageService.exists(carouselKey)).isTrue();

        mockMvc.perform(get("/api/v1/admin/media/projects/" + projectId + "/architecture"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/admin/media/projects/" + projectId + "/architecture").with(user()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/admin/media/projects/" + projectId + "/thumbnail").with(admin()))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/webp"));
        mockMvc.perform(get("/api/v1/admin/media/projects/" + projectId + "/architecture").with(admin()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG));
        mockMvc.perform(get("/api/v1/public/media/projects/" + projectId + "/thumbnail"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/public/media/projects/" + projectId + "/architecture"))
                .andExpect(status().isNotFound());
        jdbcTemplate.update("UPDATE projects SET enabled = TRUE WHERE id = ?", projectId);
        mockMvc.perform(get("/api/v1/public/media/projects/" + projectId + "/thumbnail"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("image/webp"));
        mockMvc.perform(get("/api/v1/public/media/projects/" + projectId + "/architecture"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.IMAGE_PNG));
        mockMvc.perform(get("/api/v1/public/media/projects/" + projectId + "/999999"))
                .andExpect(status().isNotFound());

        ActionChallenge replaceChallenge = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        String replaceMetadata = replaceMetadata(technologyId, carouselId);
        save(
                projectId,
                replaceMetadata,
                replaceChallenge,
                image("thumbnail", "replacement.png", "image/png", PNG),
                image("architectureImage", "replacement.webp", "image/webp", WEBP)
        ).andExpect(status().isOk())
                .andExpect(jsonPath("$.project.enabled").value(true))
                .andExpect(jsonPath("$.media[0].id").value(carouselId))
                .andExpect(jsonPath("$.media[0].label").value("updated"))
                .andExpect(jsonPath("$.media[0].displayOrder").value(7));

        String replacementKey = thumbnailKey(projectId);
        String replacementArchitectureKey = architectureKey(projectId);
        assertThat(replacementKey).isNotEqualTo(oldThumbnailKey);
        assertThat(replacementArchitectureKey).isNotEqualTo(oldArchitectureKey);
        assertThat(fileStorageService.exists(oldThumbnailKey)).isFalse();
        assertThat(fileStorageService.exists(oldArchitectureKey)).isFalse();
        assertThat(fileStorageService.exists(carouselKey)).isTrue();
        assertThat(fileStorageService.exists(replacementKey)).isTrue();
        assertThat(fileStorageService.exists(replacementArchitectureKey)).isTrue();

        ActionChallenge removeChallenge = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        save(projectId, removeImagesMetadata(technologyId, carouselId), removeChallenge)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.project.thumbnailUrl").value((Object) null))
                .andExpect(jsonPath("$.architectureImageUrl").value((Object) null))
                .andExpect(jsonPath("$.media.length()").value(0));
        assertThat(fileStorageService.exists(replacementKey)).isFalse();
        assertThat(fileStorageService.exists(replacementArchitectureKey)).isFalse();
        assertThat(fileStorageService.exists(carouselKey)).isFalse();
    }

    // 고정 Section JSON Shape와 필수 Field 누락 차단 검증
    @Test
    void invalidContentShapeIsRejectedBeforeChallenge() throws Exception {
        Long projectId = project("shape-editor", false);
        Long technologyId = technology("Shape Editor", true);
        ActionChallenge wrongShape = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        save(
                projectId,
                draftMetadata("shape-editor", technologyId).replace(
                        "\"results\":[{\"title\":\"first\",\"description\":\"one\"},{\"title\":\"second\",\"description\":\"two\"}]",
                        "\"results\":{}"
                ),
                wrongShape
        ).andExpect(status().isBadRequest());
        assertThat(challengeStatus(wrongShape.id())).isEqualTo("ACTIVE");

        ActionChallenge missingField = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        save(
                projectId,
                draftMetadata("shape-editor", technologyId).replace("\"architecture\":", "\"removedArchitecture\":"),
                missingField
        ).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors[*].field")
                        .value(org.hamcrest.Matchers.hasItem("content.architecture")));
        assertThat(challengeStatus(missingField.id())).isEqualTo("ACTIVE");
    }

    // 다른 Project 미디어 변경과 중복 미디어 변경 차단 검증
    @Test
    void mediaChangesMustBelongToProjectAndRemainUnique() throws Exception {
        Long projectId = project("reference-project", false);
        Long otherProjectId = project("reference-other", false);
        Long technologyId = technology("Reference Java", true);
        Long ownMediaId = insertMedia(projectId, "projects/" + projectId + "/carousel/current.webp");
        Long otherMediaId = insertMedia(otherProjectId, "projects/" + otherProjectId + "/carousel/other.webp");

        ActionChallenge otherProject = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        save(projectId, mediaChangeMetadata(technologyId, "[{\"id\":" + otherMediaId
                + ",\"action\":\"KEEP\",\"displayOrder\":0}]"), otherProject)
                .andExpect(status().isBadRequest());
        assertThat(challengeStatus(otherProject.id())).isEqualTo("ACTIVE");

        ActionChallenge duplicate = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        save(projectId, mediaChangeMetadata(technologyId, "[{\"id\":" + ownMediaId
                + ",\"action\":\"KEEP\",\"displayOrder\":0},{\"id\":" + ownMediaId
                + ",\"action\":\"DELETE\"}]"), duplicate)
                .andExpect(status().isBadRequest());
        assertThat(challengeStatus(duplicate.id())).isEqualTo("ACTIVE");
    }

    // 기술 중복·비활성 신규 연결과 이미지 Signature mismatch 선검증
    @Test
    void invalidTechnologyAndImageDoNotConsumeChallenge() throws Exception {
        Long projectId = project("invalid-editor", false);
        Long enabledId = technology("Enabled Editor", true);
        Long disabledId = technology("Disabled Editor", false);

        ActionChallenge duplicate = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        save(projectId, duplicateTechnologyMetadata(enabledId), duplicate)
                .andExpect(status().isBadRequest());
        assertThat(challengeStatus(duplicate.id())).isEqualTo("ACTIVE");

        ActionChallenge disabled = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        save(projectId, draftMetadata("disabled-link", disabledId), disabled)
                .andExpect(status().isBadRequest());
        assertThat(challengeStatus(disabled.id())).isEqualTo("ACTIVE");

        ActionChallenge invalidFile = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
        save(
                projectId,
                thumbnailUploadMetadata(enabledId),
                invalidFile,
                image("thumbnail", "invalid.png", "image/png", JPEG)
        ).andExpect(status().isBadRequest());
        assertThat(challengeStatus(invalidFile.id())).isEqualTo("ACTIVE");
    }

    // Wrong Operation·Target·Used·Expired PROJECT_UPDATE Challenge 차단 검증
    @Test
    void saveRequiresOneUsableProjectUpdateChallenge() throws Exception {
        Long projectId = project("auth-editor", false);
        Long technologyId = technology("Auth Editor", true);
        String metadata = draftMetadata("auth-editor-saved", technologyId);

        save(projectId, metadata, challenge("PROJECT_DELETE", "PROJECT", projectId.toString()))
                .andExpect(status().isForbidden());
        save(projectId, metadata, challenge("PROJECT_UPDATE", "PROJECT", "999999"))
                .andExpect(status().isForbidden());
        ActionChallenge used = challenge(
                adminPrincipal.id(),
                "PROJECT_UPDATE",
                "PROJECT",
                projectId.toString(),
                "USED",
                java.time.OffsetDateTime.now().plusMinutes(10)
        );
        save(projectId, metadata, used).andExpect(status().isForbidden());
        ActionChallenge expired = challenge(
                adminPrincipal.id(),
                "PROJECT_UPDATE",
                "PROJECT",
                projectId.toString(),
                "ACTIVE",
                java.time.OffsetDateTime.now().minusMinutes(1)
        );
        save(projectId, metadata, expired).andExpect(status().isForbidden());
    }

    // DB 실패 시 신규 파일 제거와 기존 Draft 유지 검증
    @Test
    void databaseFailureRemovesNewFilesAndKeepsCurrentState() throws Exception {
        Long projectId = project("rollback-editor", false);
        Long technologyId = technology("Rollback Editor", true);
        Path thumbnailDirectory = STORAGE_ROOT.resolve("projects/" + projectId + "/thumbnail");
        Path architectureDirectory = STORAGE_ROOT.resolve("projects/" + projectId + "/architecture");
        var existingFiles = regularFiles(thumbnailDirectory);
        var existingArchitectureFiles = regularFiles(architectureDirectory);
        createUpdateFailureTrigger(projectId);
        try {
            ActionChallenge challenge = challenge("PROJECT_UPDATE", "PROJECT", projectId.toString());
            save(
                    projectId,
                    thumbnailUploadMetadata(technologyId),
                    challenge,
                    image("thumbnail", "rollback.webp", "image/webp", WEBP),
                    image("architectureImage", "rollback.png", "image/png", PNG)
            ).andExpect(status().isInternalServerError());
        } finally {
            dropUpdateFailureTrigger();
        }

        assertThat(jdbcTemplate.queryForObject(
                "SELECT slug FROM projects WHERE id = ?", String.class, projectId)).isEqualTo("rollback-editor");
        assertThat(thumbnailKey(projectId)).isNull();
        assertThat(architectureKey(projectId)).isNull();
        assertThat(regularFiles(thumbnailDirectory)).containsExactlyInAnyOrderElementsOf(existingFiles);
        assertThat(regularFiles(architectureDirectory))
                .containsExactlyInAnyOrderElementsOf(existingArchitectureFiles);
    }

    private ResultActions save(Long projectId, String metadata, ActionChallenge challenge, MockMultipartFile... files)
            throws Exception {
        var request = multipart(PROJECTS_PATH + projectId)
                .file(new MockMultipartFile(
                        "metadata",
                        "metadata.json",
                        MediaType.APPLICATION_JSON_VALUE,
                        metadata.getBytes(StandardCharsets.UTF_8)
                ));
        for (MockMultipartFile file : files) {
            request.file(file);
        }
        return mockMvc.perform(request
                .with(current -> {
                    current.setMethod("PUT");
                    return current;
                })
                .with(admin())
                .with(csrf())
                .headers(actionHeaders(challenge)));
    }

    private MockMultipartFile image(String part, String name, String contentType, byte[] content) {
        return new MockMultipartFile(part, name, contentType, content);
    }

    private Long project(String slug, boolean enabled) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO projects (slug, name, enabled)
                VALUES (?, 'Editor Project', ?)
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

    private Long insertMedia(Long projectId, String storageKey) {
        return jdbcTemplate.queryForObject("""
                INSERT INTO project_media (project_id, storage_key, display_order)
                VALUES (?, ?, 0)
                RETURNING id
                """, Long.class, projectId, storageKey);
    }

    private String thumbnailKey(Long projectId) {
        return jdbcTemplate.queryForObject(
                "SELECT thumbnail_storage_key FROM projects WHERE id = ?", String.class, projectId);
    }

    private String mediaKey(Long mediaId) {
        return jdbcTemplate.queryForObject(
                "SELECT storage_key FROM project_media WHERE id = ?", String.class, mediaId);
    }

    private String architectureKey(Long projectId) {
        return jdbcTemplate.query(
                "SELECT architecture_image_storage_key FROM project_contents WHERE project_id = ?",
                resultSet -> resultSet.next() ? resultSet.getString(1) : null,
                projectId
        );
    }

    private String draftMetadata(String slug, Long technologyId) {
        return """
                {
                  "project":{"slug":"%s","name":"Draft","year":null,"tagline":null,
                    "description":null,"cardRole":null,"summary":null,"detailRole":null,
                    "startedAt":null,"endedAt":null,"teamSize":null,"displayOrder":0},
                  "content":{
                    "results":[{"title":"first","description":"one"},{"title":"second","description":"two"}],
                    "background":[],"features":[],"development":[],
                    "architecture":{"notes":[{"title":"Runtime","body":"API"}]},
                    "engineering":[]
                  },
                  "technologies":[{"technologyId":%d,"showOnCard":true,"highlighted":true,"displayOrder":0}],
                  "thumbnailMode":"KEEP","architectureImageMode":"KEEP","mediaChanges":[]
                }
                """.formatted(slug, technologyId);
    }

    private String mediaUploadMetadata(Long technologyId) {
        return """
                {
                  "project":{"slug":"media-draft","name":"Media","year":2026,"tagline":"Tagline",
                    "description":"Description","cardRole":"Backend","summary":"Summary","detailRole":"Backend",
                    "startedAt":"2026-01-01","endedAt":null,"teamSize":1,"displayOrder":2},
                  "content":{"results":[],
                    "background":[{"body":"Background"}],
                    "features":[],"development":[],
                    "architecture":{"notes":[]},
                    "engineering":[]},
                  "technologies":[{"technologyId":%d,"showOnCard":true,"highlighted":true,"displayOrder":0}],
                  "thumbnailMode":"UPLOAD",
                  "architectureImageMode":"UPLOAD",
                  "mediaChanges":[
                    {"clientKey":"carousel-new","action":"UPLOAD","uploadIndex":0,
                      "label":"screen","altText":"screen","displayOrder":5}
                  ]
                }
                """.formatted(technologyId);
    }

    private String replaceMetadata(Long technologyId, long carouselId) {
        return """
                {
                  "project":{"slug":"media-draft","name":"Media","year":2026,"tagline":"Tagline",
                    "description":"Description","cardRole":"Backend","summary":"Summary","detailRole":"Backend",
                    "startedAt":"2026-01-01","endedAt":null,"teamSize":1,"displayOrder":2},
                  "content":{"results":[],"background":[{"body":"Background"}],
                    "features":[],"development":[],
                    "architecture":{"notes":[]},
                    "engineering":[]},
                  "technologies":[{"technologyId":%d,"showOnCard":true,"highlighted":true,"displayOrder":0}],
                  "thumbnailMode":"UPLOAD",
                  "architectureImageMode":"UPLOAD",
                  "mediaChanges":[
                    {"id":%d,"action":"KEEP","label":"updated","altText":"updated","displayOrder":7}
                  ]
                }
                """.formatted(technologyId, carouselId);
    }

    private String removeImagesMetadata(Long technologyId, long carouselId) {
        return """
                {
                  "project":{"slug":"media-draft","name":"Media","year":2026,"tagline":"Tagline",
                    "description":"Description","cardRole":"Backend","summary":"Summary","detailRole":"Backend",
                    "startedAt":"2026-01-01","endedAt":null,"teamSize":1,"displayOrder":2},
                  "content":{"results":[],"background":[{"body":"Background"}],
                    "features":[],"development":[],
                    "architecture":{"notes":[]},
                    "engineering":[]},
                  "technologies":[{"technologyId":%d,"showOnCard":true,"highlighted":true,"displayOrder":0}],
                  "thumbnailMode":"REMOVE",
                  "architectureImageMode":"REMOVE",
                  "mediaChanges":[
                    {"id":%d,"action":"DELETE"}
                  ]
                }
                """.formatted(technologyId, carouselId);
    }

    private String mediaChangeMetadata(Long technologyId, String mediaChanges) {
        return """
                {
                  "project":{"slug":"reference-project","name":"Reference","year":null,"tagline":null,
                    "description":null,"cardRole":null,"summary":null,"detailRole":null,
                    "startedAt":null,"endedAt":null,"teamSize":null,"displayOrder":0},
                  "content":{"results":[],"background":[{"body":"Background"}],
                    "features":[],"development":[],
                    "architecture":{"notes":[]},
                    "engineering":[]},
                  "technologies":[{"technologyId":%d,"showOnCard":true,"highlighted":true,"displayOrder":0}],
                  "thumbnailMode":"KEEP","architectureImageMode":"KEEP","mediaChanges":%s
                }
                """.formatted(technologyId, mediaChanges);
    }

    private String duplicateTechnologyMetadata(Long technologyId) {
        String base = draftMetadata("duplicate-link", technologyId);
        return base.replace(
                "\"technologies\":[{\"technologyId\":" + technologyId
                        + ",\"showOnCard\":true,\"highlighted\":true,\"displayOrder\":0}]",
                "\"technologies\":["
                        + "{\"technologyId\":" + technologyId + ",\"showOnCard\":true,\"highlighted\":true,\"displayOrder\":0},"
                        + "{\"technologyId\":" + technologyId + ",\"showOnCard\":false,\"highlighted\":false,\"displayOrder\":1}]"
        );
    }

    private String thumbnailUploadMetadata(Long technologyId) {
        return draftMetadata("rollback-editor-saved", technologyId)
                .replace("\"thumbnailMode\":\"KEEP\"", "\"thumbnailMode\":\"UPLOAD\"")
                .replace("\"architectureImageMode\":\"KEEP\"", "\"architectureImageMode\":\"UPLOAD\"");
    }

    private void createUpdateFailureTrigger(Long projectId) {
        jdbcTemplate.execute("""
                CREATE OR REPLACE FUNCTION fail_project_update()
                RETURNS trigger AS $$
                BEGIN
                    IF NEW.id = %d THEN
                        RAISE EXCEPTION 'forced project update failure';
                    END IF;
                    RETURN NEW;
                END;
                $$ LANGUAGE plpgsql
                """.formatted(projectId));
        jdbcTemplate.execute("""
                CREATE TRIGGER trg_fail_project_update
                BEFORE UPDATE ON projects
                FOR EACH ROW EXECUTE FUNCTION fail_project_update()
                """);
    }

    private void dropUpdateFailureTrigger() {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS trg_fail_project_update ON projects");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS fail_project_update()");
    }

    private java.util.List<Path> regularFiles(Path directory) throws Exception {
        if (!Files.exists(directory)) {
            return java.util.List.of();
        }
        try (var files = Files.list(directory)) {
            return files.filter(Files::isRegularFile).toList();
        }
    }
}
