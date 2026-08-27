package com.khuoo.portfolio.site.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import tools.jackson.databind.JsonNode;

// Site PATCH 요청의 미전달·null·타입 값 판독
final class PatchValues {

    private PatchValues() {
    }

    // JSON 필드 전달 여부 반환
    static boolean present(JsonNode value) {
        return value != null;
    }

    // 최소 1개 JSON 필드 전달 검증
    static void requireAny(JsonNode... values) {
        for (JsonNode value : values) {
            if (present(value)) {
                return;
            }
        }
        throw invalid();
    }

    // null 불가 문자열 값 판독
    static String requiredString(JsonNode value, int maxLength) {
        if (value == null || value.isNull() || !value.isString()) {
            throw invalid();
        }
        String result = value.stringValue();
        if (result.isBlank() || result.length() > maxLength) {
            throw invalid();
        }
        return result;
    }

    // explicit null 허용 문자열 값 판독
    static String nullableString(JsonNode value, int maxLength) {
        if (value == null || value.isNull()) {
            return null;
        }
        if (!value.isString()) {
            throw invalid();
        }
        String result = value.stringValue();
        if (maxLength > 0 && result.length() > maxLength) {
            throw invalid();
        }
        return result;
    }

    // null 불가 Boolean 값 판독
    static boolean booleanValue(JsonNode value) {
        if (value == null || !value.isBoolean()) {
            throw invalid();
        }
        return value.booleanValue();
    }

    // null 불가 0 이상 정수 값 판독
    static int nonNegativeInt(JsonNode value) {
        if (value == null || !value.isIntegralNumber() || !value.canConvertToInt()) {
            throw invalid();
        }
        int result = value.intValue();
        if (result < 0) {
            throw invalid();
        }
        return result;
    }

    // null 불가 Enum 이름 값 판독
    static <E extends Enum<E>> E enumValue(JsonNode value, Class<E> type) {
        if (value == null || value.isNull() || !value.isString()) {
            throw invalid();
        }
        try {
            return Enum.valueOf(type, value.stringValue());
        } catch (IllegalArgumentException exception) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR, exception);
        }
    }

    private static ApiException invalid() {
        return new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
    }
}
