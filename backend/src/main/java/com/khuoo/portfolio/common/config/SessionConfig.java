package com.khuoo.portfolio.common.config;

import com.khuoo.portfolio.common.util.PortfolioConstants;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnWebApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.session.web.http.CookieSerializer;
import org.springframework.session.web.http.DefaultCookieSerializer;

// Spring Session Cookie 정책 구성
@Configuration
@ConditionalOnWebApplication(type = ConditionalOnWebApplication.Type.SERVLET)
public class SessionConfig {

    // 환경별 Session Cookie 속성 적용
    @Bean
    public CookieSerializer sessionCookieSerializer(
            @Value("${server.servlet.session.cookie.name:PORTFOLIO_SESSION}") String cookieName,
            @Value("${server.servlet.session.cookie.http-only:true}") boolean httpOnly,
            @Value("${server.servlet.session.cookie.secure:false}") boolean secure,
            @Value("${server.servlet.session.cookie.same-site:Lax}") String sameSite,
            @Value("${server.servlet.session.cookie.path:/}") String path
    ) {
        DefaultCookieSerializer serializer = new RememberMeCookieSerializer();
        serializer.setCookieName(cookieName);
        serializer.setUseHttpOnlyCookie(httpOnly);
        serializer.setUseSecureCookie(secure);
        serializer.setSameSite(sameSite);
        serializer.setCookiePath(path);
        return serializer;
    }

    // 로그인 요청별 Browser Session 또는 14일 Persistent Cookie 선택
    private static class RememberMeCookieSerializer extends DefaultCookieSerializer {

        @Override
        public void writeCookieValue(CookieValue cookieValue) {
            if (cookieValue.getCookieMaxAge() < 0
                    && Boolean.TRUE.equals(cookieValue.getRequest().getAttribute(
                    PortfolioConstants.Authentication.REMEMBER_ME_REQUEST_ATTRIBUTE))) {
                cookieValue.setCookieMaxAge(PortfolioConstants.Authentication.REMEMBER_ME_SECONDS);
            }
            super.writeCookieValue(cookieValue);
        }
    }
}
