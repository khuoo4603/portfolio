package com.khuoo.portfolio.common.util;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;

// API 응답 시각의 KST Offset 변환
public final class ResponseTime {

    private static final ZoneOffset KST = ZoneOffset.ofHours(9);

    private ResponseTime() {
    }

    // 동일 Instant의 KST Offset 시각 반환
    public static OffsetDateTime kst(OffsetDateTime value) {
        return value == null ? null : value.withOffsetSameInstant(KST);
    }
}
