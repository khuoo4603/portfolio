package com.khuoo.portfolio.analytics.repository;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

// 일별 익명 방문 집계 저장 경계
public interface VisitRepository {

    // 날짜와 방문자 Key 기준 Page View 원자적 증가
    void increase(LocalDate visitDate, UUID visitorKey, OffsetDateTime viewedAt);
}
