package com.khuoo.portfolio.authentication.security;

import com.khuoo.portfolio.common.util.PortfolioConstants;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

// 자동 로그인 Session의 최초 인증 기준 절대 만료 검사
@Component
public class SessionExpirationFilter extends OncePerRequestFilter {

    // 14일 절대 수명 초과 Session 폐기
    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        HttpSession session = request.getSession(false);
        if (isExpiredRememberMeSession(session)) {
            session.invalidate();
            SecurityContextHolder.clearContext();
        }
        filterChain.doFilter(request, response);
    }

    private boolean isExpiredRememberMeSession(HttpSession session) {
        if (session == null
                || !Boolean.TRUE.equals(session.getAttribute(
                PortfolioConstants.Authentication.REMEMBER_ME_SESSION_ATTRIBUTE))) {
            return false;
        }

        Object authenticatedAt = session.getAttribute(
                PortfolioConstants.Authentication.AUTHENTICATED_AT_SESSION_ATTRIBUTE);
        if (!(authenticatedAt instanceof Long authenticatedAtMillis)) {
            return true;
        }

        long absoluteExpirationMillis = authenticatedAtMillis
                + PortfolioConstants.Authentication.REMEMBER_ME_SECONDS * 1_000L;
        return System.currentTimeMillis() >= absoluteExpirationMillis;
    }
}
