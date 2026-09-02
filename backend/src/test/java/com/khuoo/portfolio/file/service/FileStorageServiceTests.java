package com.khuoo.portfolio.file.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.file.config.FileStorageProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.mock.web.MockMultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// 공통 Storage UUID 저장·Resource·삭제·Root 이탈 방어 검증
class FileStorageServiceTests {

    @TempDir
    private Path root;

    private FileStorageService storage;

    private final ImageFileValidator imageValidator = new ImageFileValidator();

    @BeforeEach
    void setUp() {
        storage = new FileStorageService(new FileStorageProperties(root.toString()));
    }

    // 논리 경로 UUID 저장과 Resource 조회 검증
    @Test
    void storesAndOpensUuidFileUnderLogicalDirectory() throws Exception {
        byte[] content = "stored-image".getBytes();

        FileStorageService.StoredFile stored = storage.store(
                new MockMultipartFile("file", "source.png", "image/png", content),
                "tools/links",
                "png"
        );

        assertThat(stored.storageKey()).matches("tools/links/[0-9a-f-]{36}\\.png");
        assertThat(stored.size()).isEqualTo(content.length);
        assertThat(storage.exists(stored.storageKey())).isTrue();
        assertThat(storage.open(stored.storageKey()).getContentAsByteArray()).isEqualTo(content);
        assertThat(Files.isRegularFile(root.resolve(stored.storageKey()))).isTrue();
    }

    // 신뢰 가능한 Seed 파일의 최초 복사와 기존 파일 비덮어쓰기 검증
    @Test
    void copiesSeedOnlyWhenStorageFileIsMissing() throws Exception {
        String storageKey = "projects/7/thumbnail/seed.webp";

        storage.copyIfMissing(new ByteArrayResource("first".getBytes()), storageKey);
        storage.copyIfMissing(new ByteArrayResource("second".getBytes()), storageKey);

        assertThat(storage.open(storageKey).getContentAsByteArray()).isEqualTo("first".getBytes());
    }

    // 검증 완료 JPEG·PNG·WEBP의 정규 확장자 UUID 저장 검증
    @Test
    void storesValidatedImageFormatsWithCanonicalExtensions() throws Exception {
        List<MockMultipartFile> images = List.of(
                new MockMultipartFile("image", "photo.jpeg", "image/jpeg",
                        new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0x01}),
                new MockMultipartFile("image", "preview.png", "image/png",
                        new byte[]{(byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a}),
                new MockMultipartFile("image", "cover.webp", "image/webp",
                        new byte[]{0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50})
        );

        for (MockMultipartFile image : images) {
            ImageFileValidator.ValidatedImage validated = imageValidator.validate(image);
            FileStorageService.StoredFile stored = storage.store(image, "tools/links", validated.extension());

            assertThat(stored.storageKey())
                    .matches("tools/links/[0-9a-f-]{36}\\." + validated.extension());
            assertThat(storage.open(stored.storageKey()).getContentAsByteArray()).isEqualTo(image.getBytes());
        }
    }

    // 존재 파일과 미존재 파일의 멱등 삭제 검증
    @Test
    void deletesExistingAndMissingFilesSafely() {
        FileStorageService.StoredFile stored = storage.store(
                new MockMultipartFile("file", "resume.pdf", "application/pdf", "%PDF".getBytes()),
                "resume",
                "pdf"
        );

        storage.delete(stored.storageKey());

        assertThat(storage.exists(stored.storageKey())).isFalse();
        assertThatCode(() -> storage.delete(stored.storageKey())).doesNotThrowAnyException();
    }

    // 양방향 Traversal·절대경로·Drive 경로 차단 검증
    @Test
    void rejectsKeysOutsideStorageRoot() {
        assertThatThrownBy(() -> storage.exists("../outside.png")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> storage.exists("..\\outside.png")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> storage.exists("/absolute.png")).isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> storage.exists("C:/absolute.png")).isInstanceOf(ApiException.class);
    }
}
