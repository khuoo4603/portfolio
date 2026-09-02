package com.khuoo.portfolio.monitoring.service;

import com.khuoo.portfolio.authentication.repository.LoginLogRepository;
import com.khuoo.portfolio.monitoring.repository.ErrorLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Clock;
import java.time.OffsetDateTime;
import java.time.ZoneId;

// Database 운영 로그 보관기간 정리 처리
@Service
@RequiredArgsConstructor
public class LogCleanupService {

    private static final ZoneId KST = ZoneId.of("Asia/Seoul");

    private final LoginLogRepository loginLogRepository;
    private final ErrorLogRepository errorLogRepository;
    private final Clock clock;

    // 로그인 3년·오류 365일 보관 경계 이전 기록 정리
    @Transactional
    public CleanupResult cleanup() {
        OffsetDateTime now = OffsetDateTime.now(clock).atZoneSameInstant(KST).toOffsetDateTime();
        long loginLogs = loginLogRepository.deleteBefore(now.minusYears(3));
        long errorLogs = errorLogRepository.deleteBefore(now.minusDays(365));
        return new CleanupResult(loginLogs, errorLogs);
    }

    // 로그 종류별 삭제 건수
    public record CleanupResult(long loginLogs, long errorLogs) {
    }
}
