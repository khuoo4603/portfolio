package com.khuoo.portfolio.site.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

// 현재 이력서의 공개 메타데이터
@Getter
@Entity
@Table(name = "resume_files")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ResumeFile {

    @Id
    private Short id;

    @Column(name = "original_name", nullable = false, length = 255)
    private String originalName;

    @Column(name = "storage_key", nullable = false, length = 255)
    private String storageKey;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(name = "content_type", nullable = false, length = 100)
    private String contentType;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    private ResumeFile(
            Short id,
            String originalName,
            String storageKey,
            long sizeBytes,
            String contentType
    ) {
        this.id = id;
        this.originalName = originalName;
        this.storageKey = storageKey;
        this.sizeBytes = sizeBytes;
        this.contentType = contentType;
    }

    // 현재 이력서 메타데이터 최초 생성
    public static ResumeFile create(
            Short id,
            String originalName,
            String storageKey,
            long sizeBytes,
            String contentType
    ) {
        return new ResumeFile(id, originalName, storageKey, sizeBytes, contentType);
    }

    // 현재 이력서 메타데이터 교체
    public void replace(
            String newOriginalName,
            String newStorageKey,
            long newSizeBytes,
            String newContentType,
            OffsetDateTime changedAt
    ) {
        originalName = newOriginalName;
        storageKey = newStorageKey;
        sizeBytes = newSizeBytes;
        contentType = newContentType;
        updatedAt = changedAt;
    }
}
