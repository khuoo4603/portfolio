package com.khuoo.portfolio.authentication.dto;

import io.swagger.v3.oas.annotations.media.Schema;

// 상태 변경 요청용 CSRF Token 응답
public record CsrfResponse(
        @Schema(description = "X-XSRF-TOKEN Header 전송용 CSRF Token")
        String token
) {
}
