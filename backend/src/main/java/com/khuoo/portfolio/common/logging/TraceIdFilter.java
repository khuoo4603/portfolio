package com.khuoo.portfolio.common.logging;

import com.khuoo.portfolio.common.validation.TraceIdValidator;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

// 요청 Trace ID 생성 및 전달
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@RequiredArgsConstructor
public class TraceIdFilter extends OncePerRequestFilter {

    private final TraceIdValidator traceIdValidator;

    // 요청 범위 Trace ID와 MDC 수명 관리
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        String traceId = resolveTraceId(request.getHeader(TraceContext.HEADER_NAME));
        request.setAttribute(TraceContext.REQUEST_ATTRIBUTE, traceId);
        response.setHeader(TraceContext.HEADER_NAME, traceId);
        MDC.put(TraceContext.MDC_KEY, traceId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(TraceContext.MDC_KEY);
        }
    }

    private String resolveTraceId(String requestedTraceId) {
        if (traceIdValidator.isValid(requestedTraceId)) {
            return requestedTraceId;
        }
        return UUID.randomUUID().toString();
    }
}
