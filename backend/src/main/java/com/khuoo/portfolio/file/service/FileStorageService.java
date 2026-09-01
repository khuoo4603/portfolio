package com.khuoo.portfolio.file.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.file.config.FileStorageProperties;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.InvalidPathException;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

// 단일 Storage Root의 상대 Key 기반 파일 저장소
@Service
public class FileStorageService {

    private final Path root;

    public FileStorageService(FileStorageProperties properties) {
        if (properties.storageRoot() == null || properties.storageRoot().isBlank()) {
            throw new IllegalStateException("파일 Storage Root 설정이 필요합니다.");
        }
        this.root = Path.of(properties.storageRoot()).toAbsolutePath().normalize();
    }

    // 논리 디렉터리와 안전 확장자 기반 UUID 파일 저장
    public StoredFile store(MultipartFile file, String directory, String extension) {
        if (file == null || file.isEmpty() || file.getSize() <= 0) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        if (directory == null
                || !directory.matches("[a-z0-9]+(?:/[a-z0-9-]+)*")
                || extension == null
                || !extension.matches("[a-z0-9]+")) {
            throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR);
        }

        String storageKey = directory + "/" + UUID.randomUUID() + "." + extension;
        Path target = resolve(storageKey);
        Path temporary = null;
        try {
            Files.createDirectories(target.getParent());
            temporary = Files.createTempFile(target.getParent(), ".upload-", ".tmp");
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

    // Storage Key 기반 읽기 가능 Resource 조회
    public Resource open(String storageKey) {
        Path path = resolve(storageKey);
        if (!Files.isRegularFile(path) || !Files.isReadable(path)) {
            throw new ApiException(ErrorCode.COMMON_NOT_FOUND);
        }
        return new FileSystemResource(path);
    }

    // Storage Key 기반 파일 존재 확인
    public boolean exists(String storageKey) {
        return Files.isRegularFile(resolve(storageKey));
    }

    // Storage Key 기반 멱등 파일 삭제
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(resolve(storageKey));
        } catch (IOException exception) {
            throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR, exception);
        }
    }

    // 상대 Storage Key의 Root 내부 정규화 경로 변환
    Path resolve(String storageKey) {
        if (storageKey == null
                || storageKey.isBlank()
                || storageKey.startsWith("/")
                || storageKey.contains("\\")
                || storageKey.matches("^[A-Za-z]:.*")) {
            throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR);
        }
        for (String segment : storageKey.split("/", -1)) {
            if (segment.isBlank() || segment.equals("..")) {
                throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR);
            }
        }

        try {
            Path relative = Path.of(storageKey).normalize();
            Path resolved = root.resolve(relative).normalize();
            if (relative.isAbsolute() || !resolved.startsWith(root)) {
                throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR);
            }
            return resolved;
        } catch (InvalidPathException exception) {
            throw new ApiException(ErrorCode.COMMON_INTERNAL_ERROR, exception);
        }
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
            // 최초 파일 처리 실패 원인 유지
        }
    }

    // 저장 완료 파일의 상대 Key와 실제 크기
    public record StoredFile(String storageKey, long size) {
    }
}
