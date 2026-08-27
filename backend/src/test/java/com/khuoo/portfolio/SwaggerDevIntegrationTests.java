package com.khuoo.portfolio;

import com.khuoo.portfolio.common.util.PortfolioEnums;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

// DEV Swagger ADMIN 접근 정책 검증
@ActiveProfiles("dev")
@SpringBootTest
@AutoConfigureMockMvc
class SwaggerDevIntegrationTests extends PostgresIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private Environment environment;

    // 비로그인·USER 차단과 ADMIN 허용 검증
    @Test
    void swaggerRequiresAdminRole() throws Exception {
        mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/v3/api-docs").with(user("user")
                        .roles(PortfolioEnums.AccountRole.USER.name())))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/v3/api-docs").with(user("admin")
                        .roles(PortfolioEnums.AccountRole.ADMIN.name())))
                .andExpect(status().isOk());
        org.assertj.core.api.Assertions.assertThat(
                environment.getProperty("server.servlet.session.cookie.secure", Boolean.class)
        ).isTrue();
    }
}
