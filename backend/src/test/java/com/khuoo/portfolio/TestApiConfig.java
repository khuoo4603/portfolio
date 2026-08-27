package com.khuoo.portfolio;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Profile;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.net.URI;
import java.util.Map;

// Security와 공통 응답 검증용 Test Endpoint 구성
@TestConfiguration(proxyBeanMethods = false)
public class TestApiConfig {

    @Bean
    public TestApiController testApiController() {
        return new TestApiController();
    }

    @Profile("test-api-component")
    @RestController
    public static class TestApiController {

        // 공개 API 접근 검증 응답
        @GetMapping("/api/v1/public/test")
        public Map<String, Boolean> publicApi() {
            return Map.of("ok", true);
        }

        // Session Cookie 정책 검증용 Session 생성
        @GetMapping("/api/v1/public/test/session")
        public Map<String, Boolean> createSession(HttpServletRequest request) {
            request.getSession().setAttribute("test.session", true);
            return Map.of("ok", true);
        }

        // Tools API 권한 검증 응답
        @GetMapping("/api/v1/tools/test")
        public Map<String, Boolean> toolsApi() {
            return Map.of("ok", true);
        }

        // Tools 상태 변경 CSRF 검증 응답
        @PostMapping("/api/v1/tools/test")
        public ResponseEntity<Void> updateTool() {
            return ResponseEntity.noContent().build();
        }

        // Admin API 권한 검증 응답
        @GetMapping("/api/v1/admin/test")
        public Map<String, Boolean> adminApi() {
            return Map.of("ok", true);
        }

        // Internal API CSRF 제외 검증 응답
        @PostMapping("/internal/v1/test")
        public ResponseEntity<Void> internalApi() {
            return ResponseEntity.noContent().build();
        }

        // Validation 공통 오류 응답 검증
        @PostMapping("/internal/v1/test/validation")
        public Map<String, Boolean> validation(@Valid @RequestBody ValidationRequest request) {
            return Map.of("ok", true);
        }

        // 예상하지 못한 5xx 공통 오류 응답 검증
        @GetMapping("/api/v1/public/test/failure")
        public Map<String, Boolean> failure() {
            throw new IllegalStateException("외부 노출 금지 내부 오류");
        }

        // 3xx 장기 HTTP 로그 제외 검증
        @GetMapping("/api/v1/public/test/redirect")
        public ResponseEntity<Void> redirect() {
            return ResponseEntity.status(302).location(URI.create("/api/v1/public/test")).build();
        }
    }

    public record ValidationRequest(@NotBlank(message = "이름을 입력하세요.") String name) {
    }
}
