package com.khuoo.portfolio.file.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.Arrays;
import java.util.Locale;

// 관리자 이미지 업로드 확장자·MIME·Signature·크기 검증
@Component
public class ImageFileValidator {

    public static final long MAX_IMAGE_SIZE = 5L * 1024 * 1024;

    // JPEG·PNG·WEBP 일치 검증과 정규 저장 형식 반환
    public ValidatedImage validate(MultipartFile file) {
        if (file == null || file.isEmpty() || file.getSize() <= 0 || file.getSize() > MAX_IMAGE_SIZE) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }

        String originalName = file.getOriginalFilename();
        if (originalName == null
                || originalName.isBlank()
                || originalName.chars().anyMatch(Character::isISOControl)) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        int extensionIndex = originalName.lastIndexOf('.');
        if (extensionIndex < 0 || extensionIndex == originalName.length() - 1) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }

        ImageType type = ImageType.fromExtension(originalName.substring(extensionIndex + 1));
        if (!type.contentType.equals(file.getContentType()) || !type.matches(readHeader(file))) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        return new ValidatedImage(type.extension, type.contentType);
    }

    private byte[] readHeader(MultipartFile file) {
        try (InputStream input = file.getInputStream()) {
            return input.readNBytes(12);
        } catch (IOException exception) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR, exception);
        }
    }

    private enum ImageType {
        JPEG("jpg", "image/jpeg") {
            @Override
            boolean matches(byte[] header) {
                return startsWith(header, new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff});
            }
        },
        PNG("png", "image/png") {
            @Override
            boolean matches(byte[] header) {
                return startsWith(header, new byte[]{
                        (byte) 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a
                });
            }
        },
        WEBP("webp", "image/webp") {
            @Override
            boolean matches(byte[] header) {
                return header.length >= 12
                        && Arrays.equals(Arrays.copyOfRange(header, 0, 4), new byte[]{0x52, 0x49, 0x46, 0x46})
                        && Arrays.equals(Arrays.copyOfRange(header, 8, 12), new byte[]{0x57, 0x45, 0x42, 0x50});
            }
        };

        private final String extension;
        private final String contentType;

        ImageType(String extension, String contentType) {
            this.extension = extension;
            this.contentType = contentType;
        }

        abstract boolean matches(byte[] header);

        static ImageType fromExtension(String extension) {
            return switch (extension.toLowerCase(Locale.ROOT)) {
                case "jpg", "jpeg" -> JPEG;
                case "png" -> PNG;
                case "webp" -> WEBP;
                default -> throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
            };
        }

        static boolean startsWith(byte[] actual, byte[] expected) {
            return actual.length >= expected.length
                    && Arrays.equals(Arrays.copyOf(actual, expected.length), expected);
        }
    }

    // 검증 완료 이미지의 정규 확장자와 MIME
    public record ValidatedImage(String extension, String contentType) {
    }
}
