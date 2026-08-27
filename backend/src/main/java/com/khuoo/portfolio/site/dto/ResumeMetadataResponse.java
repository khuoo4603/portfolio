package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.site.domain.ResumeFile;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 공개 이력서 메타데이터 응답
public record ResumeMetadataResponse(
        @Schema(description = "업로드 원본 파일명", example = "resume.pdf")
        String fileName,

        @Schema(description = "마지막 등록·교체 시각", example = "2026-08-27T00:00:00+09:00")
        OffsetDateTime updatedAt
) {

    // 이력서 Entity의 KST 공개 메타데이터 변환
    public static ResumeMetadataResponse from(ResumeFile resume) {
        return new ResumeMetadataResponse(
                resume.getOriginalName(),
                ResponseTime.kst(resume.getUpdatedAt())
        );
    }
}
