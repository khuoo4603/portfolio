package com.khuoo.portfolio.common.util;

import java.util.Locale;

// 이메일 저장 및 조회 전 정규화
public final class EmailNormalizer {

    private EmailNormalizer() {
    }

    // 이메일 앞뒤 공백 제거 및 영문 소문자 변환
    public static String normalize(String email) {
        if (email == null) {
            return null;
        }
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
