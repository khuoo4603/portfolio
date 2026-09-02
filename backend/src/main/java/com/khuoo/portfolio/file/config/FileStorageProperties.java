package com.khuoo.portfolio.file.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

// 환경별 단일 영속 파일 Storage Root 설정
@ConfigurationProperties(prefix = "portfolio.file")
public record FileStorageProperties(
        String storageRoot
) {
}
