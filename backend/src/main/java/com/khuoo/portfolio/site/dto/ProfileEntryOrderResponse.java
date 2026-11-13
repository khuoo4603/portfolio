package com.khuoo.portfolio.site.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 프로필 정렬 저장 후 확정된 순서 응답
public record ProfileEntryOrderResponse(
        @Schema(description = "확정된 프로필 항목 순서")
        List<AdminProfileEntryResponse> items
) {
}
