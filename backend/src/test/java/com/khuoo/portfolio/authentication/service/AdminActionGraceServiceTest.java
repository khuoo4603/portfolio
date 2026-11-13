package com.khuoo.portfolio.authentication.service;

import com.khuoo.portfolio.authentication.dto.AdminActionGraceResponse;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

class AdminActionGraceServiceTest {

    private static final Instant NOW = Instant.parse("2026-11-13T00:00:00Z");
    private static final Clock CLOCK = Clock.fixed(NOW, ZoneOffset.UTC);
    private static final AccountPrincipal ADMIN = new AccountPrincipal(
            1L, "admin@example.com", "관리자", AccountRole.ADMIN
    );

    private AdminActionGraceService service;

    @BeforeEach
    void setUp() {
        service = new AdminActionGraceService(CLOCK);
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(ADMIN, null)
        );
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void grantStoresThirtyMinuteExpiryWithoutSliding() {
        MockHttpServletRequest request = new MockHttpServletRequest();

        service.grant(request, ADMIN);
        Long expiresAt = (Long) request.getSession(false).getAttribute(
                "portfolio.authentication.adminActionVerifiedUntil"
        );

        assertThat(expiresAt).isEqualTo(NOW.plus(Duration.ofMinutes(30)).toEpochMilli());

        service.grant(request, ADMIN);

        assertThat(request.getSession(false).getAttribute(
                "portfolio.authentication.adminActionVerifiedUntil"
        )).isEqualTo(expiresAt);
    }

    @Test
    void graceIsValidUntilButNotAtExactExpiry() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.getSession(true).setAttribute(
                "portfolio.authentication.adminActionVerifiedUntil",
                NOW.plus(Duration.ofMinutes(30)).toEpochMilli()
        );

        assertThat(service.isActive(request, ADMIN)).isTrue();

        MockHttpServletRequest expiredRequest = new MockHttpServletRequest();
        expiredRequest.getSession(true).setAttribute(
                "portfolio.authentication.adminActionVerifiedUntil",
                NOW.toEpochMilli()
        );

        assertThat(service.isActive(expiredRequest, ADMIN)).isFalse();
        assertThat(expiredRequest.getSession(false).getAttribute(
                "portfolio.authentication.adminActionVerifiedUntil"
        )).isNull();
    }

    @Test
    void graceIsStillActiveImmediatelyBeforeExpiry() {
        AdminActionGraceService nearExpiryService = new AdminActionGraceService(
                Clock.fixed(NOW.minusMillis(1), ZoneOffset.UTC)
        );
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.getSession(true).setAttribute(
                "portfolio.authentication.adminActionVerifiedUntil",
                NOW.toEpochMilli()
        );

        assertThat(nearExpiryService.isActive(request, ADMIN)).isTrue();
    }

    @Test
    void statusReturnsExpiryForCurrentAdminSession() {
        MockHttpServletRequest request = new MockHttpServletRequest();
        service.grant(request, ADMIN);

        AdminActionGraceResponse response = service.getStatus(request, ADMIN);

        assertThat(response.verified()).isTrue();
        assertThat(response.expiresAt()).isEqualTo(
                NOW.plus(Duration.ofMinutes(30)).atOffset(ZoneOffset.ofHours(9))
        );
    }
}
