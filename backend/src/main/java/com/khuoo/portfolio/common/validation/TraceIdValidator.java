package com.khuoo.portfolio.common.validation;

import org.springframework.stereotype.Component;

import java.util.regex.Pattern;

// 외부 전달 Trace ID 허용 형식 검증
@Component
public class TraceIdValidator {

    private static final Pattern ALLOWED = Pattern.compile("^[A-Za-z0-9_-]{1,64}$");

    // 공통 Trace ID 허용 형식 여부 확인
    public boolean isValid(String traceId) {
        return traceId != null && ALLOWED.matcher(traceId).matches();
    }
}
