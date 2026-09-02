package com.khuoo.portfolio.analytics.service;

import com.khuoo.portfolio.analytics.dto.PageViewRequest;
import com.khuoo.portfolio.analytics.repository.VisitRepository;
import com.khuoo.portfolio.project.repository.ProjectQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;

// 공개 페이지의 익명 방문 집계 처리
@Service
@RequiredArgsConstructor
public class AnalyticsService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");
    private static final String PROJECT_PREFIX = "/projects/";

    private final VisitRepository visitRepository;
    private final ProjectQueryRepository projectQueryRepository;
    private final Clock clock;

    // 집계 허용 공개 경로의 일별 Page View 기록
    public void record(PageViewRequest request) {
        if (!isTrackable(request.path())) {
            return;
        }
        OffsetDateTime viewedAt = OffsetDateTime.now(clock).atZoneSameInstant(KST).toOffsetDateTime();
        visitRepository.increase(
                LocalDate.now(clock.withZone(KST)),
                request.visitorKey(),
                viewedAt
        );
    }

    private boolean isTrackable(String path) {
        if ("/".equals(path)) {
            return true;
        }
        if (!path.startsWith(PROJECT_PREFIX)) {
            return false;
        }
        String slug = path.substring(PROJECT_PREFIX.length());
        return !slug.isBlank()
                && !slug.contains("/")
                && projectQueryRepository.findEnabledBySlug(slug).isPresent();
    }
}
