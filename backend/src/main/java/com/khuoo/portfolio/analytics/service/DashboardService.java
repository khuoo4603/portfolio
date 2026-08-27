package com.khuoo.portfolio.analytics.service;

import com.khuoo.portfolio.analytics.dto.DashboardResponse;
import com.khuoo.portfolio.analytics.repository.DashboardQueryRepository;
import com.khuoo.portfolio.analytics.repository.DashboardQueryRepository.MonthlyTraffic;
import com.khuoo.portfolio.analytics.repository.DashboardQueryRepository.SiteCount;
import com.khuoo.portfolio.analytics.repository.DashboardQueryRepository.TrafficCount;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.monitoring.repository.ServiceStatusQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

// 관리자 대시보드 통합 조회 처리
@Service
@RequiredArgsConstructor
public class DashboardService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final ZoneOffset KST_OFFSET = ZoneOffset.ofHours(9);

    private final DashboardQueryRepository dashboardQueryRepository;
    private final ServiceStatusQueryRepository serviceStatusQueryRepository;
    private final Clock clock;

    // 요청 월 범위 기반 관리자 대시보드 조회
    public DashboardResponse find(int months) {
        if (months != 6 && months != 12) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }

        LocalDate today = LocalDate.now(clock.withZone(KST));
        LocalDate monthStart = today.withDayOfMonth(1);
        TrafficCount todayTraffic = dashboardQueryRepository.countTraffic(today, today.plusDays(1));
        TrafficCount monthTraffic = dashboardQueryRepository.countTraffic(monthStart, today.plusDays(1));
        List<DashboardResponse.Trend> trend = trend(monthStart, months);
        SiteCount site = dashboardQueryRepository.countSite();

        return new DashboardResponse(
                new DashboardResponse.Traffic(
                        todayTraffic.visitors(),
                        todayTraffic.pageViews(),
                        monthTraffic.visitors(),
                        monthTraffic.pageViews(),
                        trend
                ),
                serviceStatusQueryRepository.findCurrent().stream()
                        .map(status -> new DashboardResponse.ServiceStatusItem(
                                status.serviceKey(),
                                status.status(),
                                status.responseTimeMs(),
                                status.httpStatus(),
                                status.lastCheckedAt().withOffsetSameInstant(KST_OFFSET)
                        ))
                        .toList(),
                new DashboardResponse.SiteSummary(
                        site.publicProjects(),
                        site.portfolioTechnologies(),
                        site.activeTools(),
                        site.activeAccounts()
                )
        );
    }

    private List<DashboardResponse.Trend> trend(LocalDate currentMonth, int months) {
        LocalDate from = currentMonth.minusMonths(months - 1L);
        LocalDate toExclusive = currentMonth.plusMonths(1);
        Map<String, MonthlyTraffic> counts = new LinkedHashMap<>();
        for (MonthlyTraffic traffic : dashboardQueryRepository.findMonthlyTraffic(from, toExclusive)) {
            counts.put(traffic.month(), traffic);
        }
        return java.util.stream.IntStream.range(0, months)
                .mapToObj(index -> YearMonth.from(from.plusMonths(index)))
                .map(month -> {
                    String key = month.toString();
                    MonthlyTraffic traffic = counts.get(key);
                    return traffic == null
                            ? new DashboardResponse.Trend(key, 0, 0)
                            : new DashboardResponse.Trend(
                                    key,
                                    traffic.visitors(),
                                    traffic.pageViews()
                            );
                })
                .toList();
    }
}
