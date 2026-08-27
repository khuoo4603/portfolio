package com.khuoo.portfolio.common.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

// Backend OpenAPI 기본 정보 구성
@Configuration
public class OpenApiConfig {

    // OpenAPI 문서 식별정보 구성
    @Bean
    public OpenAPI portfolioOpenApi() {
        return new OpenAPI()
                .info(new Info()
                        .title("Portfolio Backend API")
                        .version("v1"));
    }
}
