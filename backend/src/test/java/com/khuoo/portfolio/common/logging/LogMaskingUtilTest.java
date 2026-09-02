package com.khuoo.portfolio.common.logging;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// 로그 이메일 및 민감 필드 마스킹 검증
class LogMaskingUtilTest {

    // 일반 이메일과 긴 이메일 마스킹 검증
    @Test
    void masksEmailLocalPart() {
        assertThat(LogMaskingUtil.maskEmail("khuo04603@gmail.com"))
                .isEqualTo("k****@gmail.com");
        assertThat(LogMaskingUtil.maskEmail("very.long.user+tag@example.co.kr"))
                .isEqualTo("v****@example.co.kr");
    }

    // 문장 내부의 모든 이메일 마스킹 검증
    @Test
    void masksEmailsInsideText() {
        assertThat(LogMaskingUtil.maskText("from user@example.com to Admin@Test.dev"))
                .isEqualTo("from u****@example.com to A****@Test.dev");
    }

    // 형식을 인식하지 못한 단일 이메일 입력의 원문 비노출 검증
    @Test
    void doesNotReturnUnrecognizedEmailInput() {
        assertThat(LogMaskingUtil.maskEmail("not-an-email"))
                .isEqualTo("[MASKED]");
    }

    // 대소문자와 구분자 변형을 포함한 민감 필드 검증
    @Test
    void detectsSensitiveFieldVariants() {
        assertThat(LogMaskingUtil.isSensitiveField("Password_Hash")).isTrue();
        assertThat(LogMaskingUtil.isSensitiveField("session-id")).isTrue();
        assertThat(LogMaskingUtil.isSensitiveField("ADMIN.verification-code")).isTrue();
        assertThat(LogMaskingUtil.isSensitiveField("mail_app_password")).isTrue();
        assertThat(LogMaskingUtil.isSensitiveField("requestBody")).isTrue();
        assertThat(LogMaskingUtil.isSensitiveField("status")).isFalse();
    }
}
