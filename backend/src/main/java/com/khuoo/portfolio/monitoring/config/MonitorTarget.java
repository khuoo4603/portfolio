package com.khuoo.portfolio.monitoring.config;

import java.net.URI;

// 서비스 Key와 검증된 Health URI 조합
public record MonitorTarget(String serviceKey, URI uri) {
}
