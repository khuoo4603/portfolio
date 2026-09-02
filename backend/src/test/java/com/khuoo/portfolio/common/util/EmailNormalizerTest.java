package com.khuoo.portfolio.common.util;

import org.junit.jupiter.api.Test;

import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

// 이메일 정규화 정책 검증
class EmailNormalizerTest {

    // 공백 제거와 소문자 변환 검증
    @Test
    void trimsAndLowercasesEmail() {
        assertThat(EmailNormalizer.normalize("  User@Example.COM  "))
                .isEqualTo("user@example.com");
    }

    // 시스템 Locale과 무관한 영문 소문자 변환 검증
    @Test
    void usesRootLocale() {
        Locale originalLocale = Locale.getDefault();
        try {
            Locale.setDefault(Locale.forLanguageTag("tr-TR"));
            assertThat(EmailNormalizer.normalize("I@EXAMPLE.COM"))
                    .isEqualTo("i@example.com");
        } finally {
            Locale.setDefault(originalLocale);
        }
    }

    // null 입력 유지 검증
    @Test
    void returnsNullForNullInput() {
        assertThat(EmailNormalizer.normalize(null)).isNull();
    }
}
