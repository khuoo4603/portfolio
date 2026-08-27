package com.khuoo.portfolio.common.logging;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

// 업무 이벤트 공통 형식 및 민감정보 보호 로그 출력
@Component
public class LogEventLogger {

    private static final Logger log = LoggerFactory.getLogger(LogEventLogger.class);
    private static final String SERVICE = "backend";
    private static final String EMPTY_VALUE = "-";
    private static final Pattern FIELD_NAME = Pattern.compile("[A-Za-z][A-Za-z0-9_.-]*");
    private static final Set<String> RESERVED_FIELDS = Set.of(
            "service",
            "env",
            "environment",
            "traceid",
            "event",
            "message"
    );

    private final String environment;

    public LogEventLogger(Environment environment) {
        String[] activeProfiles = environment.getActiveProfiles();
        this.environment = activeProfiles.length == 0 ? "default" : String.join(",", activeProfiles);
    }

    // 추가 필드 없는 INFO 업무 이벤트 기록
    public void info(String event, String message) {
        info(event, message, Map.of());
    }

    // 추가 필드 포함 INFO 업무 이벤트 기록
    public void info(String event, String message, Map<String, ?> fields) {
        log.info(format(event, message, fields));
    }

    // 추가 필드 없는 WARN 업무 이벤트 기록
    public void warn(String event, String message) {
        warn(event, message, Map.of());
    }

    // 추가 필드 포함 WARN 업무 이벤트 기록
    public void warn(String event, String message, Map<String, ?> fields) {
        log.warn(format(event, message, fields));
    }

    // 추가 필드 없는 ERROR 업무 이벤트와 예외 기록
    public void error(String event, String message, Throwable throwable) {
        error(event, message, Map.of(), throwable);
    }

    // 추가 필드 포함 ERROR 업무 이벤트와 예외 기록
    public void error(String event, String message, Map<String, ?> fields, Throwable throwable) {
        String formatted = format(event, message, fields);
        if (throwable == null) {
            log.error(formatted);
            return;
        }
        log.error(formatted, throwable);
    }

    private String format(String event, String message, Map<String, ?> fields) {
        String traceId = TraceContext.get();
        StringBuilder formatted = new StringBuilder()
                .append("service=").append(SERVICE)
                .append(" env=").append(environment)
                .append(" traceId=").append(traceId == null ? EMPTY_VALUE : traceId)
                .append(" event=").append(event == null ? EMPTY_VALUE : event);

        if (fields != null) {
            fields.forEach((fieldName, value) -> appendField(formatted, fieldName, value));
        }

        String maskedMessage = LogMaskingUtil.maskText(message == null ? EMPTY_VALUE : message);
        return formatted.append(" message=\"")
                .append(escape(maskedMessage))
                .append('"')
                .toString();
    }

    private void appendField(StringBuilder formatted, String fieldName, Object value) {
        if (fieldName == null || !FIELD_NAME.matcher(fieldName).matches()) {
            return;
        }

        String normalizedFieldName = fieldName.toLowerCase(Locale.ROOT)
                .replace("_", "")
                .replace("-", "")
                .replace(".", "");
        if (RESERVED_FIELDS.contains(normalizedFieldName)) {
            return;
        }

        String maskedValue = LogMaskingUtil.maskValue(fieldName, value);
        formatted.append(' ')
                .append(fieldName)
                .append('=')
                .append(formatFieldValue(maskedValue));
    }

    private String formatFieldValue(String value) {
        String escaped = escape(value);
        if (escaped.isEmpty() || escaped.chars().anyMatch(Character::isWhitespace)) {
            return '"' + escaped + '"';
        }
        return escaped;
    }

    private String escape(String value) {
        return value
                .replace("\\", "\\\\")
                .replace("\r", "\\r")
                .replace("\n", "\\n")
                .replace("\"", "\\\"");
    }
}
