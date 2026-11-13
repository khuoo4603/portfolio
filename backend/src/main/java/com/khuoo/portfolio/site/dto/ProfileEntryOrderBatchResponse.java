package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 프로필 다중 그룹 정렬 저장 후 확정된 전체 항목 응답
public record ProfileEntryOrderBatchResponse(
        @Schema(description = "확정된 프로필 항목 목록")
        List<AdminProfileEntryResponse> items
) {
}
