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
                + PortfolioEnums.ToolLinkCategory.values().length
                + PortfolioEnums.ServiceStatus.values().length
                + PortfolioEnums.ErrorService.values().length;

        assertThat(enumGroupCount).isEqualTo(15);
        assertThat(totalCodeCount).isEqualTo(86);
        assertThat(PortfolioEnums.AccountRole.values())
                .containsExactly(PortfolioEnums.AccountRole.ADMIN, PortfolioEnums.AccountRole.USER);
        assertThat(PortfolioEnums.AdminActionOperation.values()).hasSize(20);
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
