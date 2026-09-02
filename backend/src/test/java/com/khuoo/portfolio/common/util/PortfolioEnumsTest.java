package com.khuoo.portfolio.common.util;

import org.junit.jupiter.api.Test;

import java.util.Arrays;

import static org.assertj.core.api.Assertions.assertThat;

// DB_Constants Enum 그룹과 핵심 코드 검증
class PortfolioEnumsTest {

    // Enum 그룹 수와 전체 코드 수 검증
    @Test
    void containsAllEnumGroupsAndCodes() {
        long enumGroupCount = Arrays.stream(PortfolioEnums.class.getDeclaredClasses())
                .filter(Class::isEnum)
                .count();
        int totalCodeCount = PortfolioEnums.AccountRole.values().length
                + PortfolioEnums.ChallengePurpose.values().length
                + PortfolioEnums.ChallengeStatus.values().length
                + PortfolioEnums.AdminActionOperation.values().length
                + PortfolioEnums.AdminActionTarget.values().length
                + PortfolioEnums.LoginEventType.values().length
                + PortfolioEnums.LoginFailureReason.values().length
                + PortfolioEnums.DeviceType.values().length
                + PortfolioEnums.PortfolioContentCategory.values().length
                + PortfolioEnums.PortfolioContentCode.values().length
                + PortfolioEnums.ProfileEntryType.values().length
                + PortfolioEnums.TechnologyCategory.values().length
                + PortfolioEnums.ProjectMediaType.values().length
                + PortfolioEnums.ToolLinkCategory.values().length
                + PortfolioEnums.ServiceStatus.values().length
                + PortfolioEnums.ErrorService.values().length;

        assertThat(enumGroupCount).isEqualTo(16);
        assertThat(totalCodeCount).isEqualTo(88);
        assertThat(PortfolioEnums.AccountRole.values())
                .containsExactly(PortfolioEnums.AccountRole.ADMIN, PortfolioEnums.AccountRole.USER);
        assertThat(PortfolioEnums.AdminActionOperation.values()).hasSize(20);
        assertThat(PortfolioEnums.AdminActionOperation.values()).containsExactly(
                PortfolioEnums.AdminActionOperation.PORTFOLIO_CONTENT_UPDATE,
                PortfolioEnums.AdminActionOperation.PROFILE_ENTRY_CREATE,
                PortfolioEnums.AdminActionOperation.PROFILE_ENTRY_UPDATE,
                PortfolioEnums.AdminActionOperation.PROFILE_ENTRY_DELETE,
                PortfolioEnums.AdminActionOperation.RESUME_REPLACE,
                PortfolioEnums.AdminActionOperation.TECHNOLOGY_CREATE,
                PortfolioEnums.AdminActionOperation.TECHNOLOGY_UPDATE,
                PortfolioEnums.AdminActionOperation.TECHNOLOGY_DELETE,
                PortfolioEnums.AdminActionOperation.PORTFOLIO_TECHNOLOGY_UPDATE,
                PortfolioEnums.AdminActionOperation.PROJECT_CREATE,
                PortfolioEnums.AdminActionOperation.PROJECT_UPDATE,
                PortfolioEnums.AdminActionOperation.PROJECT_DELETE,
                PortfolioEnums.AdminActionOperation.PROJECT_STATUS_UPDATE,
                PortfolioEnums.AdminActionOperation.EXTERNAL_LINK_CREATE,
                PortfolioEnums.AdminActionOperation.EXTERNAL_LINK_UPDATE,
                PortfolioEnums.AdminActionOperation.EXTERNAL_LINK_DELETE,
                PortfolioEnums.AdminActionOperation.ACCOUNT_CREATE,
                PortfolioEnums.AdminActionOperation.ACCOUNT_STATUS_UPDATE,
                PortfolioEnums.AdminActionOperation.ACCOUNT_ROLE_UPDATE,
                PortfolioEnums.AdminActionOperation.ACCOUNT_PASSWORD_RESET
        );
        assertThat(PortfolioEnums.AdminActionTarget.values()).containsExactly(
                PortfolioEnums.AdminActionTarget.PORTFOLIO_CONTENT,
                PortfolioEnums.AdminActionTarget.PROFILE_ENTRY,
                PortfolioEnums.AdminActionTarget.RESUME,
                PortfolioEnums.AdminActionTarget.TECHNOLOGY,
                PortfolioEnums.AdminActionTarget.PORTFOLIO_TECHNOLOGY,
                PortfolioEnums.AdminActionTarget.PROJECT,
                PortfolioEnums.AdminActionTarget.EXTERNAL_LINK,
                PortfolioEnums.AdminActionTarget.ACCOUNT
        );
        assertThat(PortfolioEnums.ProjectMediaType.values()).containsExactly(
                PortfolioEnums.ProjectMediaType.CAROUSEL,
                PortfolioEnums.ProjectMediaType.CONTENT
        );
        assertThat(PortfolioEnums.ErrorService.values())
                .containsExactly(PortfolioEnums.ErrorService.FRONTEND, PortfolioEnums.ErrorService.BACKEND);
    }

    // 콘텐츠 Slot 16개와 전체 상위 카테고리 매핑 검증
    @Test
    void portfolioContentCodesUseDbCategoryMapping() {
        assertThat(PortfolioEnums.PortfolioContentCategory.values()).containsExactly(
                PortfolioEnums.PortfolioContentCategory.COMMON,
                PortfolioEnums.PortfolioContentCategory.MAIN,
                PortfolioEnums.PortfolioContentCategory.PROFILE,
                PortfolioEnums.PortfolioContentCategory.CONTACT
        );
        assertThat(PortfolioEnums.PortfolioContentCode.values()).hasSize(16);
        assertThat(PortfolioEnums.PortfolioContentCode.values())
                .filteredOn(contentCode -> contentCode.category() == PortfolioEnums.PortfolioContentCategory.COMMON)
                .hasSize(4);
        assertThat(PortfolioEnums.PortfolioContentCode.values())
                .filteredOn(contentCode -> contentCode.category() == PortfolioEnums.PortfolioContentCategory.MAIN)
                .hasSize(2);
        assertThat(PortfolioEnums.PortfolioContentCode.values())
                .filteredOn(contentCode -> contentCode.category() == PortfolioEnums.PortfolioContentCategory.PROFILE)
                .hasSize(9);
        assertThat(PortfolioEnums.PortfolioContentCode.values())
                .filteredOn(contentCode -> contentCode.category() == PortfolioEnums.PortfolioContentCategory.CONTACT)
                .containsExactly(PortfolioEnums.PortfolioContentCode.EMAIL);
    }
}
