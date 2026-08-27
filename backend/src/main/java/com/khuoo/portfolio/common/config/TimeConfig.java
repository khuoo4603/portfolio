package com.khuoo.portfolio.common.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;

// 애플리케이션 시각 계산의 주입 경계
@Configuration
public class TimeConfig {

    // 운영 시각 계산용 시스템 Clock 제공
    @Bean
    public Clock clock() {
        return Clock.systemUTC();
    }
}
