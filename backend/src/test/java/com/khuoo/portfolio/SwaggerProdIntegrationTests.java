package com.khuoo.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// PROD OpenAPI Endpoint 비활성 검증
@ActiveProfiles("prod")
@SpringBootTest
@AutoConfigureMockMvc
class SwaggerProdIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private Environment environment;

    // OpenAPI JSON과 Swagger UI 미등록 검증
    @Test
    void swaggerEndpointsAreDisabled() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isNotFound());
        org.assertj.core.api.Assertions.assertThat(
                environment.getProperty("server.servlet.session.cookie.secure", Boolean.class)
        ).isTrue();
    }
}
