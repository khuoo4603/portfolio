package com.khuoo.portfolio.common.config;

import com.khuoo.portfolio.common.security.RestAccessDeniedHandler;
import com.khuoo.portfolio.common.security.RestAuthenticationEntryPoint;
import com.khuoo.portfolio.authentication.security.SessionExpirationFilter;
import com.khuoo.portfolio.common.util.PortfolioEnums;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.session.ChangeSessionIdAuthenticationStrategy;
import org.springframework.security.web.authentication.session.SessionAuthenticationStrategy;
import org.springframework.security.web.context.HttpSessionSecurityContextRepository;
import org.springframework.security.web.context.SecurityContextHolderFilter;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.security.web.csrf.CookieCsrfTokenRepository;
import org.springframework.security.web.csrf.CsrfTokenRequestAttributeHandler;

// HTTP 보안 및 접근 정책 구성
@Configuration
public class SecurityConfig {

    private static final String[] SWAGGER_PATHS = {
            "/swagger-ui.html",
            "/swagger-ui/**",
            "/v3/api-docs/**"
    };

    private final RestAuthenticationEntryPoint authenticationEntryPoint;
    private final RestAccessDeniedHandler accessDeniedHandler;
    private final SessionExpirationFilter sessionExpirationFilter;
    private final boolean swaggerEnabled;
    private final boolean swaggerPublicAccess;

    public SecurityConfig(
            RestAuthenticationEntryPoint authenticationEntryPoint,
            RestAccessDeniedHandler accessDeniedHandler,
            SessionExpirationFilter sessionExpirationFilter,
            @Value("${portfolio.swagger.enabled:false}") boolean swaggerEnabled,
            @Value("${portfolio.swagger.public-access:false}") boolean swaggerPublicAccess
    ) {
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.sessionExpirationFilter = sessionExpirationFilter;
        this.swaggerEnabled = swaggerEnabled;
        this.swaggerPublicAccess = swaggerPublicAccess;
    }

    // API 영역별 인증과 CSRF 정책 구성
    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            SecurityContextRepository securityContextRepository
    ) throws Exception {
        CookieCsrfTokenRepository csrfRepository = CookieCsrfTokenRepository.withHttpOnlyFalse();
        CsrfTokenRequestAttributeHandler csrfRequestHandler = new CsrfTokenRequestAttributeHandler();

        http
                .formLogin(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .rememberMe(AbstractHttpConfigurer::disable)
                .securityContext(security -> security
                        .securityContextRepository(securityContextRepository)
                        .requireExplicitSave(true))
                .csrf(csrf -> csrf
                        .csrfTokenRepository(csrfRepository)
                        .csrfTokenRequestHandler(csrfRequestHandler)
                        .ignoringRequestMatchers("/internal/v1/**"))
                .exceptionHandling(exception -> exception
                        .authenticationEntryPoint(authenticationEntryPoint)
                        .accessDeniedHandler(accessDeniedHandler))
                .authorizeHttpRequests(authorize -> {
                    authorize
                            .requestMatchers("/api/v1/public/**").permitAll()
                            .requestMatchers(
                                    "/api/v1/auth/login",
                                    "/api/v1/auth/admin-login/verify",
                                    "/api/v1/auth/admin-login/resend",
                                    "/api/v1/auth/csrf"
                            ).permitAll()
                            .requestMatchers("/internal/v1/**").permitAll()
                            // 비노출 Actuator 경로의 404 유지
                            .requestMatchers("/actuator/**").permitAll();

                    if (!swaggerEnabled || swaggerPublicAccess) {
                        authorize.requestMatchers(SWAGGER_PATHS).permitAll();
                    } else {
                        authorize.requestMatchers(SWAGGER_PATHS)
                                .hasRole(PortfolioEnums.AccountRole.ADMIN.name());
                    }

                    authorize
                            .requestMatchers("/api/v1/tools/**")
                            .hasAnyRole(
                                    PortfolioEnums.AccountRole.USER.name(),
                                    PortfolioEnums.AccountRole.ADMIN.name()
                            )
                            .requestMatchers("/api/v1/admin/**")
                            .hasRole(PortfolioEnums.AccountRole.ADMIN.name())
                            .requestMatchers(
                                    "/api/v1/auth/logout",
                                    "/api/v1/auth/me",
                                    "/api/v1/auth/password/**"
                            ).authenticated()
                            .anyRequest().denyAll();
                })
                .addFilterAfter(sessionExpirationFilter, SecurityContextHolderFilter.class);

        return http.build();
    }

    // 비밀번호 Hash 정책 제공
    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    // Spring Session 기반 SecurityContext 저장소
    @Bean
    public SecurityContextRepository securityContextRepository() {
        return new HttpSessionSecurityContextRepository();
    }

    // 로그인 성공 시 기존 Session ID 교체 정책
    @Bean
    public SessionAuthenticationStrategy sessionAuthenticationStrategy() {
        return new ChangeSessionIdAuthenticationStrategy();
    }

    // 임의 기본 사용자 생성 차단용 빈 사용자 조회기
    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            throw new UsernameNotFoundException("등록된 인증 공급자가 없습니다.");
        };
    }
}
