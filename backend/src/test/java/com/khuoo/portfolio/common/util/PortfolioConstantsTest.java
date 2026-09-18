package com.khuoo.portfolio.common.util;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

// DB_Constants 문자열 Key와 관리자 Header 검증
class PortfolioConstantsTest {

    // Tool Key 두 개의 정확한 문자열 검증
    @Test
    void toolKeysMatchDbConstants() {
        assertThat(new String[]{
                PortfolioConstants.ToolKey.QUIZ,
                PortfolioConstants.ToolKey.LINKS
        }).containsExactly("QUIZ", "LINKS");
    }

    // 관리자 변경 작업 재인증 Header 계약 검증
    @Test
    void adminHeadersMatchApiContract() {
        assertThat(PortfolioConstants.Header.ADMIN_CHALLENGE_ID)
                .isEqualTo("X-Admin-Challenge-Id");
        assertThat(PortfolioConstants.Header.ADMIN_VERIFICATION_CODE)
                .isEqualTo("X-Admin-Verification-Code");
    }
}
