package com.khuoo.portfolio.account.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

// 관리자 계정 목록 응답
public record AdminAccountListResponse(
        @Schema(description = "계정 목록")
        List<AdminAccountItemResponse> items
) {
}
