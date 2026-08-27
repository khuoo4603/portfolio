package com.khuoo.portfolio;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.test.context.ActiveProfiles;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.ObjectMapper;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

import static org.assertj.core.api.Assertions.assertThat;

// LOCAL Profile 실제 HTTP Endpoint 통합 검증
@ActiveProfiles("local")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class LocalHttpIntegrationTests extends PostgresIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private ObjectMapper objectMapper;

    private final HttpClient httpClient = HttpClient.newHttpClient();

    // Health·Liveness·Readiness와 비노출 Actuator 검증
    @Test
    void actuatorEndpointsMatchLocalPolicy() throws Exception {
        assertHealth("/actuator/health");
        assertHealth("/actuator/health/liveness");
        assertHealth("/actuator/health/readiness");

        HttpResponse<String> envResponse = get("/actuator/env", null);
        assertThat(envResponse.statusCode()).isEqualTo(404);
    }

    // CSRF 응답과 Cookie 실제 HTTP 발급 검증
    @Test
    void csrfEndpointReturnsTokenAndCookie() throws Exception {
        HttpResponse<String> response = get("/api/v1/auth/csrf", null);
        JsonNode body = objectMapper.readTree(response.body());

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(body.path("token").asString()).isNotBlank();
        assertThat(response.headers().allValues("Set-Cookie"))
                .anyMatch(cookie -> cookie.startsWith("XSRF-TOKEN="));
    }

    // Tools·Admin 비로그인 JSON 오류와 Trace 연결 검증
    @Test
    void protectedApisReturnJsonWithTraceId() throws Exception {
        assertUnauthorized("/api/v1/tools/missing");
        assertUnauthorized("/api/v1/admin/missing");
    }

    // LOCAL Swagger와 Request ID 전달 검증
    @Test
    void swaggerAndTraceHeadersAreAvailable() throws Exception {
        HttpResponse<String> apiDocs = get("/v3/api-docs", null);
        JsonNode body = objectMapper.readTree(apiDocs.body());
        assertThat(apiDocs.statusCode()).isEqualTo(200);
        assertThat(body.path("info").path("title").asString()).isEqualTo("Portfolio Backend API");

        assertThat(get("/swagger-ui/index.html", null).statusCode()).isEqualTo(200);

        HttpResponse<String> generated = get("/api/v1/public/missing", null);
        assertThat(generated.headers().firstValue("X-Request-Id")).isPresent();

        String requestId = "local-http-validation_2026-08-27";
        HttpResponse<String> echoed = get("/api/v1/public/missing", requestId);
        assertThat(echoed.headers().firstValue("X-Request-Id")).contains(requestId);
    }

    private void assertHealth(String path) throws Exception {
        HttpResponse<String> response = get(path, null);
        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(objectMapper.readTree(response.body()).path("status").asString()).isEqualTo("UP");
    }

    private void assertUnauthorized(String path) throws Exception {
        HttpResponse<String> response = get(path, null);
        JsonNode body = objectMapper.readTree(response.body());
        String traceId = response.headers().firstValue("X-Request-Id").orElseThrow();

        assertThat(response.statusCode()).isEqualTo(401);
        assertThat(response.headers().firstValue("Content-Type")).hasValueSatisfying(
                contentType -> assertThat(contentType).startsWith("application/json")
        );
        assertThat(body.path("code").asString()).isEqualTo("AUTH_UNAUTHORIZED");
        assertThat(body.path("traceId").asString()).isEqualTo(traceId);
        assertThat(body.path("fieldErrors").isArray()).isTrue();
        assertThat(body.path("fieldErrors").size()).isZero();
    }

    private HttpResponse<String> get(String path, String requestId) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder()
                .uri(URI.create("http://localhost:" + port + path))
                .GET();
        if (requestId != null) {
            request.header("X-Request-Id", requestId);
        }
        return httpClient.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }
}
