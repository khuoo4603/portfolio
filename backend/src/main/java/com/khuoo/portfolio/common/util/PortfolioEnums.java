package com.khuoo.portfolio.common.util;

// DB 및 API 고정 Enum 중앙 정의
public final class PortfolioEnums {

    private PortfolioEnums() {
    }

    // 계정 접근 권한 코드
    public enum AccountRole {
        ADMIN,
        USER
    }

    // 이메일 인증 Challenge 목적 코드
    public enum ChallengePurpose {
        ADMIN_LOGIN,
        PASSWORD_CHANGE,
        ADMIN_ACTION
    }

    // 이메일 인증 Challenge 상태 코드
    public enum ChallengeStatus {
        ACTIVE,
        USED,
        LOCKED,
        REPLACED
    }

    // 관리자 재인증 작업 코드
    public enum AdminActionOperation {
        PORTFOLIO_CONTENT_UPDATE,
        PROFILE_ENTRY_CREATE,
        PROFILE_ENTRY_UPDATE,
        PROFILE_ENTRY_DELETE,
        RESUME_REPLACE,
        TECHNOLOGY_CREATE,
        TECHNOLOGY_UPDATE,
        TECHNOLOGY_DELETE,
        PORTFOLIO_TECHNOLOGY_UPDATE,
        PROJECT_CREATE,
        PROJECT_UPDATE,
        PROJECT_DELETE,
        PROJECT_STATUS_UPDATE,
        EXTERNAL_LINK_CREATE,
        EXTERNAL_LINK_UPDATE,
        EXTERNAL_LINK_DELETE,
        ACCOUNT_CREATE,
        ACCOUNT_STATUS_UPDATE,
        ACCOUNT_ROLE_UPDATE,
        ACCOUNT_PASSWORD_RESET,
        TOOL_STATUS_UPDATE,
        TOOL_LINK_CREATE,
        TOOL_LINK_UPDATE,
        TOOL_LINK_DELETE
    }

    // 관리자 재인증 대상 코드
    public enum AdminActionTarget {
        PORTFOLIO_CONTENT,
        PROFILE_ENTRY,
        RESUME,
        TECHNOLOGY,
        PORTFOLIO_TECHNOLOGY,
        PROJECT,
        EXTERNAL_LINK,
        ACCOUNT,
        TOOL,
        TOOL_LINK
    }

    // 로그인 이벤트 유형 코드
    public enum LoginEventType {
        LOGIN_SUCCESS,
        LOGIN_FAILURE
    }

    // 로그인 실패 사유 코드
    public enum LoginFailureReason {
        INVALID_CREDENTIALS,
        ACCOUNT_DISABLED,
        RATE_LIMITED,
        VERIFICATION_FAILED,
        VERIFICATION_EXPIRED,
        VERIFICATION_LOCKED
    }

    // 접속 기기 유형 코드
    public enum DeviceType {
        DESKTOP,
        MOBILE,
        TABLET,
        OTHER
    }

    // 포트폴리오 고정 콘텐츠 영역 코드
    public enum PortfolioContentCategory {
        COMMON,
        MAIN,
        PROFILE,
        CONTACT,
        FOOTER
    }

    // 포트폴리오 고정 콘텐츠 Slot 코드와 상위 영역
    public enum PortfolioContentCode {
        SITE_MARK(PortfolioContentCategory.COMMON),
        NAME(PortfolioContentCategory.COMMON),
        ENGLISH_NAME(PortfolioContentCategory.COMMON),
        POSITION(PortfolioContentCategory.COMMON),
        AFFILIATION(PortfolioContentCategory.COMMON),
        NAV_ABOUT(PortfolioContentCategory.COMMON),
        NAV_TECH(PortfolioContentCategory.COMMON),
        NAV_PROJECTS(PortfolioContentCategory.COMMON),
        NAV_EDUCATION(PortfolioContentCategory.COMMON),

        HERO_POSITION(PortfolioContentCategory.MAIN),
        HERO_STATEMENT(PortfolioContentCategory.MAIN),
        HERO_DESCRIPTION(PortfolioContentCategory.MAIN),
        HERO_CUE(PortfolioContentCategory.MAIN),
        ABOUT_SECTION_LABEL(PortfolioContentCategory.MAIN),
        ABOUT_SECTION_TITLE(PortfolioContentCategory.MAIN),
        TECH_SECTION_LABEL(PortfolioContentCategory.MAIN),
        TECH_SECTION_TITLE(PortfolioContentCategory.MAIN),
        PROJECTS_SECTION_LABEL(PortfolioContentCategory.MAIN),
        PROJECTS_SECTION_TITLE(PortfolioContentCategory.MAIN),
        PROJECT_DETAIL_CTA(PortfolioContentCategory.MAIN),
        ACHIEVEMENTS_SECTION_LABEL(PortfolioContentCategory.MAIN),
        ACHIEVEMENTS_SECTION_TITLE(PortfolioContentCategory.MAIN),
        EDUCATION_GROUP_TITLE(PortfolioContentCategory.MAIN),
        ACTIVITY_GROUP_TITLE(PortfolioContentCategory.MAIN),
        AWARD_GROUP_TITLE(PortfolioContentCategory.MAIN),

        ABOUT_STATEMENT(PortfolioContentCategory.PROFILE),
        ABOUT_POSITION(PortfolioContentCategory.PROFILE),
        ABOUT_DESCRIPTION_1(PortfolioContentCategory.PROFILE),
        ABOUT_DESCRIPTION_2(PortfolioContentCategory.PROFILE),
        DEVELOPMENT_VALUES_TITLE(PortfolioContentCategory.PROFILE),
        DEVELOPMENT_VALUE_1_TITLE(PortfolioContentCategory.PROFILE),
        DEVELOPMENT_VALUE_1_DESCRIPTION(PortfolioContentCategory.PROFILE),
        DEVELOPMENT_VALUE_2_TITLE(PortfolioContentCategory.PROFILE),
        DEVELOPMENT_VALUE_2_DESCRIPTION(PortfolioContentCategory.PROFILE),
        DEVELOPMENT_VALUE_3_TITLE(PortfolioContentCategory.PROFILE),
        DEVELOPMENT_VALUE_3_DESCRIPTION(PortfolioContentCategory.PROFILE),

        EMAIL(PortfolioContentCategory.CONTACT),

        FOOTER_NAME(PortfolioContentCategory.FOOTER),
        FOOTER_ROLE(PortfolioContentCategory.FOOTER),
        RESUME_LABEL(PortfolioContentCategory.FOOTER),
        RESUME_VIEW_LABEL(PortfolioContentCategory.FOOTER),
        RESUME_DOWNLOAD_LABEL(PortfolioContentCategory.FOOTER),
        CONTACT_LABEL(PortfolioContentCategory.FOOTER),
        PORTFOLIO_LABEL(PortfolioContentCategory.FOOTER),
        COPYRIGHT(PortfolioContentCategory.FOOTER);

        private final PortfolioContentCategory category;

        PortfolioContentCode(PortfolioContentCategory category) {
            this.category = category;
        }

        // 콘텐츠 코드의 상위 카테고리 조회
        public PortfolioContentCategory category() {
            return category;
        }
    }

    // 프로필 반복 항목 유형 코드
    public enum ProfileEntryType {
        EDUCATION,
        EXPERIENCE,
        ACTIVITY,
        AWARD,
        CERTIFICATE
    }

    // 기술 스택 분류 코드
    public enum TechnologyCategory {
        LANGUAGE,
        BACKEND,
        DATABASE,
        FRONTEND,
        INFRA,
        DEVOPS
    }

    // Tool 링크 분류 코드
    public enum ToolLinkCategory {
        REFERENCE,
        MY_SERVICES
    }

    // 모니터링 서비스 상태 코드
    public enum ServiceStatus {
        UP,
        DOWN
    }

    // HTTP 5xx 오류 발생 서비스 코드
    public enum ErrorService {
        FRONTEND,
        BACKEND
    }
}
