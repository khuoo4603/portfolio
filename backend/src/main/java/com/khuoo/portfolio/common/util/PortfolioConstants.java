package com.khuoo.portfolio.common.util;

import java.time.Duration;

// DB 및 API 고정 문자열 Key 중앙 정의
public final class PortfolioConstants {

    private PortfolioConstants() {
    }

    // 로그인 제한과 Session 수명 정책
    public static final class Authentication {

        public static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(10);
        public static final int EMAIL_FAILURE_LIMIT = 5;
        public static final int IP_FAILURE_LIMIT = 20;
        public static final int SESSION_IDLE_TIMEOUT_SECONDS = (int) Duration.ofHours(8).toSeconds();
        public static final int REMEMBER_ME_SECONDS = (int) Duration.ofDays(14).toSeconds();
        public static final String REMEMBER_ME_REQUEST_ATTRIBUTE =
                "com.khuoo.portfolio.authentication.REMEMBER_ME";
        public static final String REMEMBER_ME_SESSION_ATTRIBUTE =
                "portfolio.authentication.rememberMe";
        public static final String AUTHENTICATED_AT_SESSION_ATTRIBUTE =
                "portfolio.authentication.authenticatedAt";

        private Authentication() {
        }
    }

    // Tool 식별 Key
    public static final class ToolKey {

        public static final String QUIZ = "QUIZ";
        public static final String LINKS = "LINKS";

        private ToolKey() {
        }
    }

    // 모니터링 서비스 식별 Key
    public static final class ServiceKey {

        public static final String PORTFOLIO_FRONTEND = "PORTFOLIO_FRONTEND";
        public static final String PORTFOLIO_BACKEND = "PORTFOLIO_BACKEND";
        public static final String KYVC_FRONTEND = "KYVC_FRONTEND";
        public static final String KYVC_BACKEND = "KYVC_BACKEND";
        public static final String KYVC_CORE = "KYVC_CORE";
        public static final String SHKUTRACK = "SHKUTRACK";

        private ServiceKey() {
        }
    }

    // 관리자 변경 작업 재인증 Header
    public static final class Header {

        public static final String ADMIN_CHALLENGE_ID = "X-Admin-Challenge-Id";
        public static final String ADMIN_VERIFICATION_CODE = "X-Admin-Verification-Code";

        private Header() {
        }
    }
}
