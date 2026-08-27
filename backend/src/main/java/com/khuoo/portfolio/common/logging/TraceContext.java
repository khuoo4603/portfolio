package com.khuoo.portfolio.common.logging;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.MDC;

// 요청 Trace ID 조회 기준
public final class TraceContext {

    public static final String HEADER_NAME = "X-Request-Id";
    public static final String MDC_KEY = "traceId";
    public static final String REQUEST_ATTRIBUTE = TraceContext.class.getName() + ".traceId";

    private TraceContext() {
    }

    // 현재 Thread의 Trace ID 조회
    public static String get() {
        return MDC.get(MDC_KEY);
    }

    // 현재 요청 또는 Thread의 Trace ID 조회
    public static String get(HttpServletRequest request) {
        Object traceId = request.getAttribute(REQUEST_ATTRIBUTE);
        if (traceId instanceof String value) {
            return value;
        }
        return get();
    }
}
