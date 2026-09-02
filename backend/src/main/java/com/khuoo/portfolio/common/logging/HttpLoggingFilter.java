package com.khuoo.portfolio.common.logging;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// HTTP 요청 결과 파일 로그 기록
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class HttpLoggingFilter extends OncePerRequestFilter {

    private static final Logger httpLog = LoggerFactory.getLogger("HTTP_REQUEST");

    private final String environment;

    public HttpLoggingFilter(Environment environment) {
        String[] activeProfiles = environment.getActiveProfiles();
        this.environment = activeProfiles.length == 0 ? "default" : String.join(",", activeProfiles);
    }

    // HTTP 상태별 장기 로그 분류 및 처리시간 기록
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long startedAt = System.nanoTime();

        try {
            filterChain.doFilter(request, response);
        } finally {
            int status = response.getStatus();
            if (shouldLog(request.getRequestURI(), status)) {
                writeLog(request, status, elapsedMillis(startedAt));
            }
        }
    }

    private boolean shouldLog(String path, int status) {
        if (status >= 300 && status < 400) {
            return false;
        }
        return !isSuccessfulHealth(path, status);
    }

    private boolean isSuccessfulHealth(String path, int status) {
        return status >= 200 && status < 300
                && (path.equals("/actuator/health") || path.startsWith("/actuator/health/"));
    }

    private long elapsedMillis(long startedAt) {
        return (System.nanoTime() - startedAt) / 1_000_000;
    }

    private void writeLog(HttpServletRequest request, int status, long durationMs) {
        String message;
        if (status >= 500) {
            message = "요청 처리 중 오류 발생";
        } else if (status >= 400) {
            message = "요청 처리 실패";
        } else if (status >= 200) {
            message = "요청 처리 완료";
        } else {
            return;
        }

        String format = "service=backend env={} traceId={} method={} path={} status={} durationMs={} message=\"{}\"";
        Object[] arguments = {
                environment,
                TraceContext.get(request),
                request.getMethod(),
                request.getRequestURI(),
                status,
                durationMs,
                message
        };

        if (status >= 500) {
            httpLog.error(format, arguments);
        } else if (status >= 400) {
            httpLog.warn(format, arguments);
        } else {
            httpLog.info(format, arguments);
        }
    }
}
