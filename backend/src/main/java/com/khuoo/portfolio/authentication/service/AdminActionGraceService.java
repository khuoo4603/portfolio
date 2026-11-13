package com.khuoo.portfolio.authentication.service;

import com.khuoo.portfolio.authentication.dto.AdminActionGraceResponse;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Objects;

// 현재 ADMIN 세션의 관리자 작업 재인증 유예 생성·검사·상태 조회
@Service
@RequiredArgsConstructor
public class AdminActionGraceService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final Clock clock;

    // 유효한 관리자 작업 재인증 성공의 현재 세션 유예 기록
    public void grant(HttpServletRequest request, AccountPrincipal currentAdmin) {
        if (request == null || !isCurrentAdmin(currentAdmin)) {
            return;
        }

        HttpSession session = request.getSession(true);
        long now = nowMillis();
        Object storedValue = session.getAttribute(
                PortfolioConstants.Authentication.ADMIN_ACTION_VERIFIED_UNTIL_SESSION_ATTRIBUTE
        );
        if (storedValue instanceof Number storedExpiry && storedExpiry.longValue() > now) {
            return;
        }

        session.setAttribute(
                PortfolioConstants.Authentication.ADMIN_ACTION_VERIFIED_UNTIL_SESSION_ATTRIBUTE,
                now + PortfolioConstants.Authentication.ADMIN_ACTION_GRACE_PERIOD.toMillis()
        );
    }

    // 현재 ADMIN 세션의 관리자 작업 재인증 유예 유효성 확인
    public boolean isActive(HttpServletRequest request, AccountPrincipal currentAdmin) {
        if (request == null || !isCurrentAdmin(currentAdmin)) {
            return false;
        }

        HttpSession session = request.getSession(false);
        if (session == null) {
            return false;
        }

        Object storedValue = session.getAttribute(
                PortfolioConstants.Authentication.ADMIN_ACTION_VERIFIED_UNTIL_SESSION_ATTRIBUTE
        );
        if (!(storedValue instanceof Number storedExpiry)) {
            return false;
        }

        long expiry = storedExpiry.longValue();
        if (nowMillis() < expiry) {
            return true;
        }

        session.removeAttribute(
                PortfolioConstants.Authentication.ADMIN_ACTION_VERIFIED_UNTIL_SESSION_ATTRIBUTE
        );
        return false;
    }

    // 현재 ADMIN 세션의 관리자 작업 재인증 유예 상태 반환
    public AdminActionGraceResponse getStatus(
            HttpServletRequest request,
            AccountPrincipal currentAdmin
    ) {
        if (!isActive(request, currentAdmin)) {
            return new AdminActionGraceResponse(false, null);
        }

        Number expiry = (Number) request.getSession(false).getAttribute(
                PortfolioConstants.Authentication.ADMIN_ACTION_VERIFIED_UNTIL_SESSION_ATTRIBUTE
        );
        return new AdminActionGraceResponse(
                true,
                OffsetDateTime.ofInstant(Instant.ofEpochMilli(expiry.longValue()), SERVICE_ZONE)
        );
    }

    private boolean isCurrentAdmin(AccountPrincipal currentAdmin) {
        if (currentAdmin == null || currentAdmin.role() != AccountRole.ADMIN) {
            return false;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null
                || !(authentication.getPrincipal() instanceof AccountPrincipal sessionPrincipal)) {
            return false;
        }

        return sessionPrincipal.role() == AccountRole.ADMIN
                && Objects.equals(sessionPrincipal.id(), currentAdmin.id());
    }

    private long nowMillis() {
        return Instant.now(clock).toEpochMilli();
    }
}
