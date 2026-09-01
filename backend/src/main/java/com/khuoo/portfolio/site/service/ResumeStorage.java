package com.khuoo.portfolio.site.service;

import com.khuoo.portfolio.file.service.FileStorageService;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

// 현재 이력서 PDF의 공통 Storage 연결 Adapter
@Component
public class ResumeStorage {

    private static final String RESUME_DIRECTORY = "resume";
    private static final String PDF_EXTENSION = "pdf";

    private final FileStorageService fileStorageService;

    public ResumeStorage(FileStorageService fileStorageService) {
        this.fileStorageService = fileStorageService;
    }

    // Resume 논리 경로의 UUID PDF 저장
    public StoredFile store(MultipartFile file) {
        FileStorageService.StoredFile stored = fileStorageService.store(file, RESUME_DIRECTORY, PDF_EXTENSION);
        return new StoredFile(stored.storageKey(), stored.size());
    }

    // Storage Key 기반 공개 파일 Resource 열기
    public Resource open(String storageKey) {
        return fileStorageService.open(storageKey);
    }

    // Storage Key 기반 파일 삭제
    public void delete(String storageKey) {
        fileStorageService.delete(storageKey);
    }

    // Storage Key 기반 파일 존재 여부 확인
    public boolean exists(String storageKey) {
        return fileStorageService.exists(storageKey);
    }

    // 저장 완료된 파일의 외부 비노출 식별정보
    public record StoredFile(String storageKey, long size) {
    }
}
