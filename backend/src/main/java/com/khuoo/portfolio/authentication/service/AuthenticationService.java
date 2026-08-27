package com.khuoo.portfolio.authentication.service;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.account.repository.AccountRepository;
import com.khuoo.portfolio.authentication.domain.ClientInfo;
import com.khuoo.portfolio.authentication.domain.LoginLog;
import com.khuoo.portfolio.authentication.dto.CurrentUserResponse;
import com.khuoo.portfolio.authentication.dto.LoginRequest;
import com.khuoo.portfolio.authentication.dto.LoginResponse;
import com.khuoo.portfolio.authentication.repository.LoginLogQueryRepository;
import com.khuoo.portfolio.authentication.repository.LoginLogRepository;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.logging.LogEventLogger;
import com.khuoo.portfolio.common.logging.TraceContext;
import com.khuoo.portfolio.common.util.EmailNormalizer;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import com.khuoo.portfolio.common.util.PortfolioEnums.LoginFailureReason;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.servlet.http.HttpSession;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.List;
import java.util.Map;

// Account Credential 검증과 USER Session 수명 관리
@Service
@RequiredArgsConstructor
public class AuthenticationService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final AccountRepository accountRepository;
    private final LoginLogRepository loginLogRepository;
    private final LoginLogQueryRepository loginLogQueryRepository;
    private final ClientInfoResolver clientInfoResolver;
    private final PasswordEncoder passwordEncoder;
    private final SecurityContextRepository securityContextRepository;
    private final SessionAuthenticationStrategy sessionAuthenticationStrategy;
    private final LogEventLogger logEventLogger;

    // USER Credential 검증과 Spring Session 인증 생성
    public LoginResponse login(
            LoginRequest loginRequest,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        String email = EmailNormalizer.normalize(loginRequest.email());
        ClientInfo clientInfo = clientInfoResolver.resolve(request);
        OffsetDateTime occurredAt = OffsetDateTime.now(SERVICE_ZONE);
        String traceId = traceId(request);

        verifyRateLimit(email, clientInfo, occurredAt, traceId);

        Account account = accountRepository.findByEmail(email).orElse(null);
        if (account == null) {
            fail(null, email, LoginFailureReason.INVALID_CREDENTIALS, clientInfo, occurredAt, traceId);
        }
        if (!account.isEnabled()) {
            fail(account.getId(), email, LoginFailureReason.ACCOUNT_DISABLED, clientInfo, occurredAt, traceId);
        }
        if (!passwordEncoder.matches(loginRequest.password(), account.getPasswordHash())) {
            fail(account.getId(), email, LoginFailureReason.INVALID_CREDENTIALS, clientInfo, occurredAt, traceId);
        }

        // ADMIN_LOGIN Challenge 미구현 단계의 Session 생성 차단
        if (account.getRole() == AccountRole.ADMIN) {
            logEventLogger.warn(
                    "authentication.login.deferred",
                    "관리자 이메일 인증 단계 미완료",
                    Map.of("accountId", account.getId())
            );
            throw new ApiException(ErrorCode.AUTH_ADMIN_VERIFICATION_UNAVAILABLE);
        }

        Authentication authentication = createAuthentication(account);
        createSession(authentication, loginRequest.rememberMe(), request, response);
        loginLogRepository.save(LoginLog.success(occurredAt, account.getId(), email, clientInfo, traceId));
        logEventLogger.info(
                "authentication.login.success",
                "USER 로그인 완료",
                Map.of("accountId", account.getId(), "role", account.getRole())
        );
        return LoginResponse.user();
    }

    // 현재 인증 주체의 최신 계정 공개 정보 조회
    public CurrentUserResponse getCurrentUser(Authentication authentication) {
        if (authentication == null || !(authentication.getPrincipal() instanceof AccountPrincipal principal)) {
            throw new ApiException(ErrorCode.AUTH_UNAUTHORIZED);
        }

        Account account = accountRepository.findById(principal.id())
                .filter(Account::isEnabled)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_UNAUTHORIZED));
        return CurrentUserResponse.from(account);
    }

    // 현재 Session과 SecurityContext 폐기
    public void logout(
            HttpServletRequest request,
            HttpServletResponse response,
            Authentication authentication
    ) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
        SecurityContextHolder.clearContext();
    }

    private void verifyRateLimit(
            String email,
            ClientInfo clientInfo,
            OffsetDateTime occurredAt,
            String traceId
    ) {
        OffsetDateTime since = occurredAt.minus(PortfolioConstants.Authentication.RATE_LIMIT_WINDOW);
        boolean emailLimited = loginLogQueryRepository.countFailuresByEmailSince(email, since)
                >= PortfolioConstants.Authentication.EMAIL_FAILURE_LIMIT;
        boolean ipLimited = loginLogQueryRepository.countFailuresByIpSince(clientInfo.ipAddress(), since)
                >= PortfolioConstants.Authentication.IP_FAILURE_LIMIT;
        if (!emailLimited && !ipLimited) {
            return;
        }

        Long accountId = accountRepository.findByEmail(email).map(Account::getId).orElse(null);
        loginLogRepository.save(LoginLog.failure(
                occurredAt,
                accountId,
                email,
                LoginFailureReason.RATE_LIMITED,
                clientInfo,
                traceId
        ));
        logEventLogger.warn(
                "authentication.login.failure",
                "로그인 시도 제한",
                Map.of("failureReason", LoginFailureReason.RATE_LIMITED)
        );
        throw new ApiException(ErrorCode.AUTH_RATE_LIMITED);
    }

    private void fail(
            Long accountId,
            String email,
            LoginFailureReason failureReason,
            ClientInfo clientInfo,
            OffsetDateTime occurredAt,
            String traceId
    ) {
        loginLogRepository.save(LoginLog.failure(
                occurredAt,
                accountId,
                email,
                failureReason,
                clientInfo,
                traceId
        ));
        logEventLogger.warn(
                "authentication.login.failure",
                "로그인 Credential 검증 실패",
                Map.of("failureReason", failureReason)
        );
        throw new ApiException(ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    private Authentication createAuthentication(Account account) {
        AccountPrincipal principal = AccountPrincipal.from(account);
        SimpleGrantedAuthority authority = new SimpleGrantedAuthority("ROLE_" + account.getRole().name());
        return new UsernamePasswordAuthenticationToken(principal, null, List.of(authority));
    }

    private void createSession(
            Authentication authentication,
            boolean rememberMe,
            HttpServletRequest request,
            HttpServletResponse response
    ) {
        sessionAuthenticationStrategy.onAuthentication(authentication, request, response);
        request.setAttribute(
                PortfolioConstants.Authentication.REMEMBER_ME_REQUEST_ATTRIBUTE,
                rememberMe ? Boolean.TRUE : null
        );

        HttpSession session = request.getSession(true);
        session.setMaxInactiveInterval(rememberMe
                ? PortfolioConstants.Authentication.REMEMBER_ME_SECONDS
                : PortfolioConstants.Authentication.SESSION_IDLE_TIMEOUT_SECONDS);
        session.setAttribute(PortfolioConstants.Authentication.REMEMBER_ME_SESSION_ATTRIBUTE, rememberMe);
        session.setAttribute(
                PortfolioConstants.Authentication.AUTHENTICATED_AT_SESSION_ATTRIBUTE,
                System.currentTimeMillis()
        );

        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        securityContextRepository.saveContext(context, request, response);
    }

    private String traceId(HttpServletRequest request) {
        String traceId = TraceContext.get(request);
        return traceId == null ? "unavailable" : traceId;
    }
}
