package com.khuoo.portfolio.analytics.repository;

import java.time.LocalDate;
import java.util.List;

// 관리자 대시보드 통계 조회 경계
public interface DashboardQueryRepository {

    // 지정 날짜 구간 방문자와 Page View 집계
    TrafficCount countTraffic(LocalDate from, LocalDate toExclusive);

    // 지정 날짜 구간 월별 방문 추이 조회
    List<MonthlyTraffic> findMonthlyTraffic(LocalDate from, LocalDate toExclusive);

    // 사이트 운영 대상별 활성 수 집계
    SiteCount countSite();

    // 방문자와 Page View 집계값
    record TrafficCount(long visitors, long pageViews) {
    }

    // 월별 방문 집계값
    record MonthlyTraffic(String month, long visitors, long pageViews) {
    }

    // 사이트 운영 대상별 활성 수
    record SiteCount(
            long publicProjects,
            long portfolioTechnologies,
            long activeTools,
            long activeAccounts
    ) {
    }
}
