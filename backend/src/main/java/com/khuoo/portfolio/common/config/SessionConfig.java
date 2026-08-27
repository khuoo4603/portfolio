package com.khuoo.portfolio.common.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.session.autoconfigure.DefaultCookieSerializerCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Spring Session Cookie 정책 구성
@Configuration
public class SessionConfig {

    // 환경별 Session Cookie 속성 적용
    @Bean
    public DefaultCookieSerializerCustomizer sessionCookieCustomizer(
            @Value("${server.servlet.session.cookie.name:PORTFOLIO_SESSION}") String cookieName,
            @Value("${server.servlet.session.cookie.http-only:true}") boolean httpOnly,
            @Value("${server.servlet.session.cookie.secure:false}") boolean secure,
            @Value("${server.servlet.session.cookie.same-site:Lax}") String sameSite,
            @Value("${server.servlet.session.cookie.path:/}") String path
    ) {
        return serializer -> {
            serializer.setCookieName(cookieName);
            serializer.setUseHttpOnlyCookie(httpOnly);
            serializer.setUseSecureCookie(secure);
            serializer.setSameSite(sameSite);
            serializer.setCookiePath(path);
        };
    }
}
