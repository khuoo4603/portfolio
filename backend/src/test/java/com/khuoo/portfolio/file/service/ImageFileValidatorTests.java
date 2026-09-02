package com.khuoo.portfolio.file.service;

import com.khuoo.portfolio.common.error.ApiException;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

// 이미지 확장자·MIME·Signature·5MiB 경계 검증
class ImageFileValidatorTests {

    private static final byte[] JPEG = {(byte) 0xff, (byte) 0xd8, (byte) 0xff, 0x01};
    private static final byte[] PNG = {
            (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x01
    };
    private static final byte[] WEBP = {
            0x52, 0x49, 0x46, 0x46, 0x04, 0x00, 0x00, 0x00, 0x57, 0x45, 0x42, 0x50
    };

    private final ImageFileValidator validator = new ImageFileValidator();

    // 허용 이미지별 정규 확장자와 MIME 검증
    @Test
    void acceptsJpegPngAndWebp() {
        assertThat(validator.validate(image("photo.jpeg", "image/jpeg", JPEG)))
                .isEqualTo(new ImageFileValidator.ValidatedImage("jpg", "image/jpeg"));
        assertThat(validator.validate(image("preview.PNG", "image/png", PNG)))
                .isEqualTo(new ImageFileValidator.ValidatedImage("png", "image/png"));
        assertThat(validator.validate(image("cover.webp", "image/webp", WEBP)))
                .isEqualTo(new ImageFileValidator.ValidatedImage("webp", "image/webp"));
    }

    // 5MiB 포함 허용과 초과 차단 검증
    @Test
    void enforcesFiveMebibyteLimit() {
        byte[] allowed = new byte[(int) ImageFileValidator.MAX_IMAGE_SIZE];
        System.arraycopy(PNG, 0, allowed, 0, PNG.length);
        byte[] oversized = new byte[(int) ImageFileValidator.MAX_IMAGE_SIZE + 1];
        System.arraycopy(PNG, 0, oversized, 0, PNG.length);

        assertThat(validator.validate(image("allowed.png", "image/png", allowed)).extension()).isEqualTo("png");
        assertThatThrownBy(() -> validator.validate(image("oversized.png", "image/png", oversized)))
                .isInstanceOf(ApiException.class);
    }

    // 확장자·MIME·Signature 불일치와 비허용 형식 차단 검증
    @Test
    void rejectsMismatchedOrUnsupportedImages() {
        assertThatThrownBy(() -> validator.validate(image("file.gif", "image/gif", PNG)))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> validator.validate(image("file.png", "image/jpeg", PNG)))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> validator.validate(image("file.png", "image/png", JPEG)))
                .isInstanceOf(ApiException.class);
        assertThatThrownBy(() -> validator.validate(image("renamed.png", "image/png", "MZ executable".getBytes())))
                .isInstanceOf(ApiException.class);
    }

    private MockMultipartFile image(String name, String contentType, byte[] content) {
        return new MockMultipartFile("image", name, contentType, content);
    }
}
