package com.khuoo.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// LOCAL OpenAPI 비로그인 접근 검증
@ActiveProfiles("local")
@SpringBootTest
@AutoConfigureMockMvc
class SwaggerLocalIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    // OpenAPI JSON과 Swagger UI Resource 활성 검증
    @Test
    void swaggerIsPubliclyAvailable() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.info.title").value("Portfolio Backend API"))
                .andExpect(jsonPath("$.info.version").value("v1"));

        mockMvc.perform(get("/swagger-ui/index.html"))
                .andExpect(status().isOk());
    }
}
