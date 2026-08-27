package com.khuoo.portfolio;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.site.service.ResumeService;
import com.khuoo.portfolio.site.service.ResumeStorage;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doThrow;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// Resume PDF 검증·안전 교체·공개 Binary·실패 안전성·동시성 통합 검증
@SpringBootTest
@AutoConfigureMockMvc
class ResumeIntegrationTests extends SiteIntegrationTestSupport {

    private static final String ADMIN_RESUME = "/api/v1/admin/site/resume";
    private static final String PUBLIC_RESUME = "/api/v1/public/resume";
    private static final byte[] PDF_A = "%PDF-1.4\nresume-a".getBytes();
    private static final byte[] PDF_B = "%PDF-1.4\nresume-b".getBytes();
    private static final Path STORAGE_ROOT;

    static {
        try {
            STORAGE_ROOT = Files.createTempDirectory("portfolio-resume-test-").toAbsolutePath().normalize();
        } catch (IOException exception) {
            throw new ExceptionInInitializerError(exception);
        }
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ResumeService resumeService;

    @MockitoSpyBean
    private ResumeStorage resumeStorage;

    // Test별 OS Temp Resume 경로 등록
    @DynamicPropertySource
    static void resumeProperties(DynamicPropertyRegistry registry) {
        registry.add("portfolio.file.resume-directory", STORAGE_ROOT::toString);
    }

    // Test별 Storage 파일과 Spy 동작 초기화
    @BeforeEach
    void clearResumeStorage() throws IOException {
        Mockito.reset(resumeStorage);
        try (var files = Files.list(STORAGE_ROOT)) {
            for (Path file : files.toList()) {
                Files.deleteIfExists(file);
            }
        }
    }

    // Test 종료 후 생성한 OS Temp Resume 경로 제거
    @AfterAll
    static void deleteResumeStorage() throws IOException {
        if (!Files.exists(STORAGE_ROOT)) {
            return;
        }
        try (var paths = Files.walk(STORAGE_ROOT)) {
            for (Path path : paths.sorted(Comparator.reverseOrder()).toList()) {
                Files.deleteIfExists(path);
            }
        }
    }

    // 최초 등록·교체·Metadata·Public Binary와 표준 Header 검증
    @Test
    void firstUploadAndReplaceExposeOnlyCurrentPdf() throws Exception {
        mockMvc.perform(get(PUBLIC_RESUME))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("RESUME_NOT_FOUND"));

        ActionChallenge first = challenge("RESUME_REPLACE", "RESUME", null);
        upload(pdf("경력 이력서 A.pdf", PDF_A), first, true, admin())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("경력 이력서 A.pdf"))
                .andExpect(jsonPath("$.size").value(PDF_A.length))
                .andExpect(jsonPath("$.updatedAt").value(org.hamcrest.Matchers.endsWith("+09:00")));
        String firstKey = storageKey();
        assertThat(firstKey).matches("[0-9a-f-]{36}\\.pdf");
        assertThat(firstKey).doesNotContain("이력서");
        assertThat(Files.readAllBytes(STORAGE_ROOT.resolve(firstKey))).isEqualTo(PDF_A);
        assertPublicPdf(PDF_A, "경력 이력서 A.pdf");

        ActionChallenge second = challenge("RESUME_REPLACE", "RESUME", null);
        upload(pdf("resume B.pdf", PDF_B), second, true, admin())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fileName").value("resume B.pdf"));
        String secondKey = storageKey();
        assertThat(secondKey).isNotEqualTo(firstKey);
        assertThat(Files.exists(STORAGE_ROOT.resolve(firstKey))).isFalse();
        assertThat(Files.readAllBytes(STORAGE_ROOT.resolve(secondKey))).isEqualTo(PDF_B);
        assertPublicPdf(PDF_B, "resume B.pdf");

        upload(pdf("reuse.pdf", PDF_A), second, true, admin()).andExpect(status().isForbidden());
        assertThat(storageKey()).isEqualTo(secondKey);
        assertThat(Files.readAllBytes(STORAGE_ROOT.resolve(secondKey))).isEqualTo(PDF_B);
    }

    // 파일·확장자·MIME·Header·크기·파일명 검증과 Challenge 선검증 순서 확인
    @Test
    void invalidPdfNeverConsumesChallengeOrCreatesMetadata() throws Exception {
        List<MockMultipartFile> invalidFiles = List.of(
                pdf("empty.pdf", new byte[0]),
                new MockMultipartFile("file", "resume.txt", "application/pdf", PDF_A),
                new MockMultipartFile("file", "resume.pdf", "text/plain", PDF_A),
                new MockMultipartFile("file", "resume.pdf", "application/pdf", "NOT-PDF".getBytes()),
                pdf("x".repeat(252) + ".pdf", PDF_A)
        );
        for (MockMultipartFile invalid : invalidFiles) {
            ActionChallenge challenge = challenge("RESUME_REPLACE", "RESUME", null);
            upload(invalid, challenge, true, admin()).andExpect(status().isBadRequest());
            assertThat(challengeStatus(challenge.id())).isEqualTo("ACTIVE");
            assertThat(resumeCount()).isZero();
            assertThat(storageFileCount()).isZero();
        }

        byte[] oversized = new byte[10 * 1024 * 1024 + 1];
        System.arraycopy("%PDF".getBytes(), 0, oversized, 0, 4);
        ActionChallenge large = challenge("RESUME_REPLACE", "RESUME", null);
        upload(pdf("large.pdf", oversized), large, true, admin())
                .andExpect(status().isPayloadTooLarge());
        assertThat(challengeStatus(large.id())).isEqualTo("ACTIVE");
        assertThat(resumeCount()).isZero();
        assertThat(storageFileCount()).isZero();
    }

    // 익명·USER·CSRF·ADMIN_ACTION과 경로형 원본명 Storage 격리 검증
    @Test
    void uploadRequiresAdminCsrfAndResumeBoundChallenge() throws Exception {
        ActionChallenge anonymous = challenge("RESUME_REPLACE", "RESUME", null);
        upload(pdf("resume.pdf", PDF_A), anonymous, true, null).andExpect(status().isUnauthorized());
        ActionChallenge userChallenge = challenge("RESUME_REPLACE", "RESUME", null);
        upload(pdf("resume.pdf", PDF_A), userChallenge, true, user()).andExpect(status().isForbidden());
        ActionChallenge noCsrf = challenge("RESUME_REPLACE", "RESUME", null);
        upload(pdf("resume.pdf", PDF_A), noCsrf, false, admin()).andExpect(status().isForbidden());
        ActionChallenge wrong = challenge("PROJECT_UPDATE", "PROJECT", null);
        upload(pdf("resume.pdf", PDF_A), wrong, true, admin()).andExpect(status().isForbidden());
        assertThat(resumeCount()).isZero();

        ActionChallenge traversal = challenge("RESUME_REPLACE", "RESUME", null);
        upload(pdf("../../resume.pdf", PDF_A), traversal, true, admin()).andExpect(status().isOk());
        assertThat(storageKey()).matches("[0-9a-f-]{36}\\.pdf");
        assertThat(STORAGE_ROOT.resolve(storageKey()).normalize().startsWith(STORAGE_ROOT)).isTrue();
        assertThatThrownBy(() -> resumeStorage.open("../outside.pdf"))
                .isInstanceOf(ApiException.class);
    }

    // Storage·DB·이전 파일 삭제 실패 시 현재 Resume와 신규 파일 정리 조건 검증
    @Test
    void replacementFailuresPreserveAConsistentCurrentResume() throws Exception {
        ActionChallenge first = challenge("RESUME_REPLACE", "RESUME", null);
        upload(pdf("first.pdf", PDF_A), first, true, admin()).andExpect(status().isOk());
        String firstKey = storageKey();

        doThrow(new ApiException(ErrorCode.COMMON_INTERNAL_ERROR))
                .when(resumeStorage).store(any());
        ActionChallenge storageFailure = challenge("RESUME_REPLACE", "RESUME", null);
        upload(pdf("storage-failure.pdf", PDF_B), storageFailure, true, admin())
                .andExpect(status().isInternalServerError());
        assertThat(storageKey()).isEqualTo(firstKey);
        assertThat(Files.readAllBytes(STORAGE_ROOT.resolve(firstKey))).isEqualTo(PDF_A);
        Mockito.reset(resumeStorage);

        int filesBeforeDbFailure = storageFileCount();
        createFailureTrigger();
        try {
            ActionChallenge dbFailure = challenge("RESUME_REPLACE", "RESUME", null);
            upload(pdf("db-failure.pdf", PDF_B), dbFailure, true, admin())
                    .andExpect(status().isInternalServerError());
            assertThat(challengeStatus(dbFailure.id())).isEqualTo("ACTIVE");
        } finally {
            dropFailureTrigger();
        }
        assertThat(storageKey()).isEqualTo(firstKey);
        assertThat(storageFileCount()).isEqualTo(filesBeforeDbFailure);
        assertThat(Files.readAllBytes(STORAGE_ROOT.resolve(firstKey))).isEqualTo(PDF_A);

        doThrow(new IOException("forced previous delete failure"))
                .when(resumeStorage).delete(eq(firstKey));
        ActionChallenge deleteFailure = challenge("RESUME_REPLACE", "RESUME", null);
        upload(pdf("current.pdf", PDF_B), deleteFailure, true, admin()).andExpect(status().isOk());
        String currentKey = storageKey();
        assertThat(currentKey).isNotEqualTo(firstKey);
        assertThat(Files.exists(STORAGE_ROOT.resolve(firstKey))).isTrue();
        assertThat(Files.readAllBytes(STORAGE_ROOT.resolve(currentKey))).isEqualTo(PDF_B);
        assertPublicPdf(PDF_B, "current.pdf");

        Files.delete(STORAGE_ROOT.resolve(currentKey));
        mockMvc.perform(get(PUBLIC_RESUME))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.message").value("요청 처리 중 오류가 발생했습니다."))
                .andExpect(content().string(org.hamcrest.Matchers.not(
                        org.hamcrest.Matchers.containsString(STORAGE_ROOT.toString()))));
    }

    // 동시 최초 등록·교체 후 Metadata 1행과 공개 파일 일치 검증
    @Test
    void concurrentRegistrationAndReplacementLeaveOneConsistentResume() throws Exception {
        ActionChallenge first = challenge("RESUME_REPLACE", "RESUME", null);
        ActionChallenge second = challenge("RESUME_REPLACE", "RESUME", null);
        int firstSuccesses = runConcurrently(
                () -> resumeService.replace(pdf("first-a.pdf", PDF_A), adminPrincipal, first.id(), first.code()),
                () -> resumeService.replace(pdf("first-b.pdf", PDF_B), adminPrincipal, second.id(), second.code())
        );
        assertThat(firstSuccesses).isGreaterThanOrEqualTo(1);
        assertCurrentMetadataAndFile();

        ActionChallenge third = challenge("RESUME_REPLACE", "RESUME", null);
        ActionChallenge fourth = challenge("RESUME_REPLACE", "RESUME", null);
        int replacementSuccesses = runConcurrently(
                () -> resumeService.replace(pdf("replace-a.pdf", PDF_A), adminPrincipal, third.id(), third.code()),
                () -> resumeService.replace(pdf("replace-b.pdf", PDF_B), adminPrincipal, fourth.id(), fourth.code())
        );
        assertThat(replacementSuccesses).isEqualTo(2);
        assertCurrentMetadataAndFile();
    }

    private org.springframework.test.web.servlet.ResultActions upload(
            MockMultipartFile file,
            ActionChallenge challenge,
            boolean withCsrf,
            org.springframework.test.web.servlet.request.RequestPostProcessor principal
    ) throws Exception {
        var request = multipart(HttpMethod.PUT, ADMIN_RESUME)
                .file(file)
                .headers(actionHeaders(challenge));
        if (principal != null) {
            request.with(principal);
        }
        if (withCsrf) {
            request.with(csrf());
        }
        return mockMvc.perform(request);
    }

    private void assertPublicPdf(byte[] expected, String originalName) throws Exception {
        mockMvc.perform(get(PUBLIC_RESUME))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/pdf"))
                .andExpect(header().longValue("Content-Length", expected.length))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.allOf(
                        org.hamcrest.Matchers.startsWith("inline;"),
                        org.hamcrest.Matchers.containsString("filename*=UTF-8''")
                )))
                .andExpect(content().bytes(expected));
        assertThat(jdbcTemplate.queryForObject(
                "SELECT original_name FROM resume_files WHERE id = 1", String.class)).isEqualTo(originalName);
    }

    private MockMultipartFile pdf(String originalName, byte[] content) {
        return new MockMultipartFile("file", originalName, "application/pdf", content);
    }

    private String storageKey() {
        return jdbcTemplate.queryForObject(
                "SELECT storage_key FROM resume_files WHERE id = 1", String.class);
    }

    private int resumeCount() {
        return jdbcTemplate.queryForObject("SELECT COUNT(*) FROM resume_files", Integer.class);
    }

    private int storageFileCount() throws IOException {
        try (var files = Files.list(STORAGE_ROOT)) {
            return (int) files.filter(Files::isRegularFile).count();
        }
    }

    private void createFailureTrigger() {
        jdbcTemplate.execute("""
                CREATE OR REPLACE FUNCTION resume_test_failure() RETURNS trigger AS '
                BEGIN RAISE EXCEPTION ''forced resume test failure''; END' LANGUAGE plpgsql
                """);
        jdbcTemplate.execute("""
                CREATE TRIGGER resume_test_failure_trigger
                BEFORE UPDATE ON resume_files
                FOR EACH ROW EXECUTE FUNCTION resume_test_failure()
                """);
    }

    private void dropFailureTrigger() {
        jdbcTemplate.execute("DROP TRIGGER IF EXISTS resume_test_failure_trigger ON resume_files");
        jdbcTemplate.execute("DROP FUNCTION IF EXISTS resume_test_failure()");
    }

    private int runConcurrently(ThrowingAction first, ThrowingAction second) throws Exception {
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService executor = Executors.newFixedThreadPool(2);
        List<Future<Boolean>> futures = new ArrayList<>();
        try {
            futures.add(executor.submit(() -> runAction(first, ready, start)));
            futures.add(executor.submit(() -> runAction(second, ready, start)));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            int successes = 0;
            for (Future<Boolean> future : futures) {
                if (future.get(20, TimeUnit.SECONDS)) {
                    successes++;
                }
            }
            return successes;
        } finally {
            executor.shutdownNow();
        }
    }

    private boolean runAction(ThrowingAction action, CountDownLatch ready, CountDownLatch start) {
        try {
            ready.countDown();
            start.await();
            action.run();
            return true;
        } catch (Exception exception) {
            return false;
        }
    }

    private void assertCurrentMetadataAndFile() throws IOException {
        assertThat(resumeCount()).isOne();
        String key = storageKey();
        Path current = STORAGE_ROOT.resolve(key);
        assertThat(Files.isRegularFile(current)).isTrue();
        long metadataSize = jdbcTemplate.queryForObject(
                "SELECT size_bytes FROM resume_files WHERE id = 1", Long.class);
        assertThat(Files.size(current)).isEqualTo(metadataSize);
    }

    @FunctionalInterface
    private interface ThrowingAction {
        void run() throws Exception;
    }
}
