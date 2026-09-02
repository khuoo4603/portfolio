package com.khuoo.portfolio.site.dto;

import com.khuoo.portfolio.common.util.ResponseTime;
import com.khuoo.portfolio.site.domain.ResumeFile;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.OffsetDateTime;

// 관리자 이력서 등록·교체 응답
public record ResumeUpdateResponse(
        @Schema(description = "업로드 원본 파일명") String fileName,
        @Schema(description = "파일 크기 Byte") long size,
        @Schema(description = "마지막 등록·교체 시각") OffsetDateTime updatedAt
) {

    // 이력서 Entity의 관리자 응답 변환
    public static ResumeUpdateResponse from(ResumeFile resume) {
        return new ResumeUpdateResponse(
                resume.getOriginalName(),
                resume.getSizeBytes(),
                ResponseTime.kst(resume.getUpdatedAt())
        );
    }
}
