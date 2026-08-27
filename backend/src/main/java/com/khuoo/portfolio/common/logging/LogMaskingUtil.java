package com.khuoo.portfolio.common.logging;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

// Application File Log 개인정보 및 민감정보 마스킹
public final class LogMaskingUtil {

    private static final String MASKED_VALUE = "[MASKED]";
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "(?i)([a-z0-9.!#$%&'*+/=?^_`{|}~-]+)@([a-z0-9-]+(?:\\.[a-z0-9-]+)+)"
    );
    private static final Set<String> SENSITIVE_FIELDS = Set.of(
            "password",
            "passwordhash",
            "session",
            "sessionid",
            "cookie",
            "csrf",
            "verificationcode",
            "adminverificationcode",
            "secret",
            "token",
            "authorization",
            "mailapppassword",
            "dbpassword",
            "requestbody"
    );

    private LogMaskingUtil() {
    }

    // 단일 이메일 원문 비노출 마스킹
    public static String maskEmail(String email) {
        if (email == null) {
            return null;
        }
        if (!EMAIL_PATTERN.matcher(email).find()) {
            return MASKED_VALUE;
        }
        return maskText(email);
    }

    // 문자열 내부 이메일 전체 마스킹
    public static String maskText(String text) {
        if (text == null) {
            return null;
        }

        Matcher matcher = EMAIL_PATTERN.matcher(text);
        StringBuilder masked = new StringBuilder();
        while (matcher.find()) {
            String replacement = matcher.group(1).charAt(0) + "****@" + matcher.group(2);
            matcher.appendReplacement(masked, Matcher.quoteReplacement(replacement));
        }
        matcher.appendTail(masked);
        return masked.toString();
    }

    // 민감 필드명 변형 포함 여부 확인
    public static boolean isSensitiveField(String fieldName) {
        if (fieldName == null) {
            return false;
        }

        String normalized = fieldName.toLowerCase(Locale.ROOT)
                .replace("_", "")
                .replace("-", "")
                .replace(".", "");
        return SENSITIVE_FIELDS.stream().anyMatch(normalized::contains);
    }

    // 필드명 정책을 반영한 로그 값 마스킹
    public static String maskValue(String fieldName, Object value) {
        if (value == null) {
            return "null";
        }
        if (isSensitiveField(fieldName)) {
            return MASKED_VALUE;
        }
        return maskText(String.valueOf(value));
    }
}
