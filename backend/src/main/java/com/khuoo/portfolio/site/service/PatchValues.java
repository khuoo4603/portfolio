package com.khuoo.portfolio.site.service;

import tools.jackson.databind.JsonNode;

import java.time.LocalDate;

// 기존 Site PATCH 호출부의 공통 판독 Utility 연결
final class PatchValues {

    private PatchValues() {
    }

    // JSON 필드 전달 여부 반환
    static boolean present(JsonNode value) {
        return com.khuoo.portfolio.common.validation.PatchValues.present(value);
    }

    // 최소 1개 JSON 필드 전달 검증
    static void requireAny(JsonNode... values) {
        com.khuoo.portfolio.common.validation.PatchValues.requireAny(values);
    }

    // null 불가 문자열 값 판독
    static String requiredString(JsonNode value, int maxLength) {
        return com.khuoo.portfolio.common.validation.PatchValues.requiredString(value, maxLength);
    }

    // explicit null 허용 문자열 값 판독
    static String nullableString(JsonNode value, int maxLength) {
        return com.khuoo.portfolio.common.validation.PatchValues.nullableString(value, maxLength);
    }

    // null 불가 Boolean 값 판독
    static boolean booleanValue(JsonNode value) {
        return com.khuoo.portfolio.common.validation.PatchValues.booleanValue(value);
    }

    // null 불가 0 이상 정수 값 판독
    static int nonNegativeInt(JsonNode value) {
        return com.khuoo.portfolio.common.validation.PatchValues.nonNegativeInt(value);
    }

    // null 불가 SMALLINT 범위 값 판독
    static short shortValue(JsonNode value) {
        return com.khuoo.portfolio.common.validation.PatchValues.shortValue(value);
    }

    // explicit null 허용 양수 SMALLINT 값 판독
    static Short nullablePositiveShort(JsonNode value) {
        return com.khuoo.portfolio.common.validation.PatchValues.nullablePositiveShort(value);
    }

    // explicit null 허용 ISO 날짜 값 판독
    static LocalDate nullableDate(JsonNode value) {
        return com.khuoo.portfolio.common.validation.PatchValues.nullableDate(value);
    }

    // null 불가 Enum 이름 값 판독
    static <E extends Enum<E>> E enumValue(JsonNode value, Class<E> type) {
        return com.khuoo.portfolio.common.validation.PatchValues.enumValue(value, type);
    }
}
