package com.khuoo.portfolio.site.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

// 현재 이력서 PDF의 로컬 파일 시스템 저장소
@Component
public class ResumeStorage {

    private final Path root;

    public ResumeStorage(@Value("${portfolio.file.resume-directory}") String directory) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
    }

    // 임시 파일 전체 기록 후 random key 최종 파일 저장
    public StoredFile store(MultipartFile file) {
        Path temporary = null;
        Path target = null;
        try {
            Files.createDirectories(root);
            temporary = Files.createTempFile(root, ".resume-upload-", ".tmp");
            String storageKey = UUID.randomUUID() + ".pdf";
            target = resolve(storageKey);
            try (InputStream input = file.getInputStream()) {
                Files.copy(input, temporary, StandardCopyOption.REPLACE_EXISTING);
            }
            move(temporary, target);
            return new StoredFile(storageKey, Files.size(target));
        } catch (IOException exception) {
            deleteQuietly(temporary);
            deleteQuietly(target);
            throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR, exception);
        }
    }

    // Storage Key 기반 공개 파일 Resource 열기
    public Resource open(String storageKey) {
        Path path = resolve(storageKey);
        if (!Files.isRegularFile(path) || !Files.isReadable(path)) {
            throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
        return new FileSystemResource(path);
    }

    // Storage Key 기반 파일 삭제
    public void delete(String storageKey) throws IOException {
        Files.deleteIfExists(resolve(storageKey));
    }

    // Storage Key 기반 파일 존재 여부 확인
    public boolean exists(String storageKey) {
        return Files.isRegularFile(resolve(storageKey));
    }

    private Path resolve(String storageKey) {
        Path resolved = root.resolve(storageKey).normalize();
        if (!resolved.startsWith(root)) {
            throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
        return resolved;
    }

    private void move(Path source, Path target) throws IOException {
        try {
            Files.move(source, target, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException exception) {
            Files.move(source, target);
        }
    }

    private void deleteQuietly(Path path) {
        if (path == null) {
            return;
        }
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // 저장 실패 원인 예외 유지
        }
    }

    // 저장 완료된 파일의 외부 비노출 식별정보
    public record StoredFile(String storageKey, long size) {
    }
}
