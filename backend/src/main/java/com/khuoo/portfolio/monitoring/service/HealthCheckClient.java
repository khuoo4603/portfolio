package com.khuoo.portfolio.monitoring.service;

import com.khuoo.portfolio.common.util.PortfolioEnums.ServiceStatus;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

// JDK HTTP Client 기반 단일 서비스 Health 검사
public class HealthCheckClient {

    // DB Snapshot Retry 정책 기반 최종 상태 반환
    public HealthCheckResult check(URI uri, MonitoringRuntimeSettings settings) {
        HealthCheckResult result = HealthCheckResult.unreachable();
        int maxRetries = Math.max(0, settings.maxRetries());
        HttpClient httpClient;
        try {
            httpClient = HttpClient.newBuilder()
                    .connectTimeout(settings.connectTimeout())
                    .build();
        } catch (RuntimeException exception) {
            return result;
        }
        for (int attempt = 0; attempt <= maxRetries; attempt++) {
            result = request(httpClient, uri, settings.requestTimeout());
            if (result.status() == ServiceStatus.UP || attempt == maxRetries) {
                return result;
            }
            if (!waitForRetry(settings.retryDelay())) {
                return HealthCheckResult.unreachable();
            }
        }
        return result;
    }

    private HealthCheckResult request(HttpClient httpClient, URI uri, Duration requestTimeout) {
        HttpRequest request = HttpRequest.newBuilder(uri)
                .timeout(requestTimeout)
                .GET()
                .build();
        long startedAt = System.nanoTime();
        try {
            HttpResponse<Void> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
            int responseTimeMs = elapsedMillis(startedAt);
            ServiceStatus status = response.statusCode() >= 200 && response.statusCode() < 300
                    ? ServiceStatus.UP
                    : ServiceStatus.DOWN;
            return new HealthCheckResult(status, responseTimeMs, response.statusCode());
        } catch (IOException exception) {
            return HealthCheckResult.unreachable();
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return HealthCheckResult.unreachable();
        }
    }

    private boolean waitForRetry(Duration retryDelay) {
        if (retryDelay.isZero()) {
            return true;
        }
        try {
            Thread.sleep(retryDelay);
            return true;
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            return false;
        } catch (IllegalArgumentException exception) {
            return false;
        }
    }

    private int elapsedMillis(long startedAt) {
        long elapsed = Duration.ofNanos(System.nanoTime() - startedAt).toMillis();
        return (int) Math.min(elapsed, Integer.MAX_VALUE);
    }

    // 최종 상태와 저장 가능한 응답 측정값
    public record HealthCheckResult(ServiceStatus status, Integer responseTimeMs, Integer httpStatus) {

        public static HealthCheckResult unreachable() {
            return new HealthCheckResult(ServiceStatus.DOWN, null, null);
        }
    }
}
