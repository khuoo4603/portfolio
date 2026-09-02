package com.khuoo.portfolio.common.util;

import java.time.Duration;
import java.util.List;

// DB 및 API 고정 문자열 Key 중앙 정의
public final class PortfolioConstants {

    private PortfolioConstants() {
    }

    // 로그인 제한과 Session 수명 정책
    public static final class Authentication {

        public static final Duration RATE_LIMIT_WINDOW = Duration.ofMinutes(10);
        public static final int EMAIL_FAILURE_LIMIT = 5;
        public static final int IP_FAILURE_LIMIT = 20;
        public static final Duration CHALLENGE_VALIDITY = Duration.ofMinutes(5);
        public static final Duration CHALLENGE_RESEND_DELAY = Duration.ofSeconds(60);
        public static final Duration CHALLENGE_SEND_WINDOW = Duration.ofHours(1);
        public static final int CHALLENGE_FAILURE_LIMIT = 5;
        public static final int CHALLENGE_SEND_LIMIT = 30;
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
        public static final List<String> ORDERED = List.of(
                PORTFOLIO_FRONTEND,
                PORTFOLIO_BACKEND,
                KYVC_FRONTEND,
                KYVC_BACKEND,
                KYVC_CORE,
                SHKUTRACK
        );

        private ServiceKey() {
        }
    }

    // 서비스 상태 확인의 변경 불가능한 실행 정책
    public static final class Monitoring {

        public static final long CHECK_INTERVAL_MS = 300_000L;
        public static final int MAX_RETRIES = 1;

        private Monitoring() {
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
