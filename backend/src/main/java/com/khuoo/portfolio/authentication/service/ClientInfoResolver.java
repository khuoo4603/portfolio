package com.khuoo.portfolio.authentication.service;

import com.khuoo.portfolio.authentication.domain.ClientInfo;
import com.khuoo.portfolio.common.util.PortfolioEnums.DeviceType;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.Arrays;
import java.util.Locale;

// 신뢰 Proxy 경계와 User-Agent 기반 Client 정보 판별
@Component
public class ClientInfoResolver {

    private static final String FORWARDED_FOR = "X-Forwarded-For";

    private final boolean forwardedHeaderEnabled;

    public ClientInfoResolver(Environment environment) {
        this.forwardedHeaderEnabled = Arrays.stream(environment.getActiveProfiles())
                .anyMatch(profile -> profile.equals("dev") || profile.equals("prod"));
    }

    // 로그인 요청의 IP·Browser·OS·기기 정보 정규화
    public ClientInfo resolve(HttpServletRequest request) {
        String userAgent = request.getHeader("User-Agent");
        String normalizedUserAgent = userAgent == null ? "" : userAgent;
        String lowerUserAgent = normalizedUserAgent.toLowerCase(Locale.ROOT);

        return new ClientInfo(
                resolveIpAddress(request),
                userAgent,
                resolveBrowser(lowerUserAgent),
                resolveOperatingSystem(lowerUserAgent),
                resolveDevice(lowerUserAgent)
        );
    }

    private String resolveIpAddress(HttpServletRequest request) {
        String remoteAddress = normalizeAddress(request.getRemoteAddr());
        if (!forwardedHeaderEnabled || !isTrustedProxy(remoteAddress)) {
            return remoteAddress;
        }

        String forwardedAddress = request.getHeader(FORWARDED_FOR);
        if (forwardedAddress == null || forwardedAddress.contains(",")) {
            return remoteAddress;
        }

        String normalizedForwardedAddress = normalizeAddress(forwardedAddress);
        return isIpAddress(normalizedForwardedAddress) ? normalizedForwardedAddress : remoteAddress;
    }

    private String normalizeAddress(String address) {
        if (address == null || address.isBlank()) {
            return "0.0.0.0";
        }
        String normalized = address.trim();
        if (normalized.equals("0:0:0:0:0:0:0:1")) {
            return "::1";
        }
        return normalized.length() <= 45 ? normalized : "0.0.0.0";
    }

    private boolean isTrustedProxy(String address) {
        try {
            InetAddress inetAddress = InetAddress.getByName(address);
            return inetAddress.isLoopbackAddress() || inetAddress.isSiteLocalAddress();
        } catch (UnknownHostException exception) {
            return false;
        }
    }

    private boolean isIpAddress(String address) {
        if (!address.matches("[0-9A-Fa-f:.]+")) {
            return false;
        }
        try {
            InetAddress.getByName(address);
            return true;
        } catch (UnknownHostException exception) {
            return false;
        }
    }

    private String resolveBrowser(String userAgent) {
        if (userAgent.contains("edg/")) {
            return "Edge";
        }
        if (userAgent.contains("opr/") || userAgent.contains("opera")) {
            return "Opera";
        }
        if (userAgent.contains("chrome/") || userAgent.contains("crios/")) {
            return "Chrome";
        }
        if (userAgent.contains("firefox/") || userAgent.contains("fxios/")) {
            return "Firefox";
        }
        if (userAgent.contains("safari/") && !userAgent.contains("chrome/")) {
            return "Safari";
        }
        return "Other";
    }

    private String resolveOperatingSystem(String userAgent) {
        if (userAgent.contains("windows")) {
            return "Windows";
        }
        if (userAgent.contains("android")) {
            return "Android";
        }
        if (userAgent.contains("iphone") || userAgent.contains("ipad") || userAgent.contains("ios")) {
            return "iOS";
        }
        if (userAgent.contains("mac os") || userAgent.contains("macintosh")) {
            return "macOS";
        }
        if (userAgent.contains("linux") || userAgent.contains("x11")) {
            return "Linux";
        }
        return "Other";
    }

    private DeviceType resolveDevice(String userAgent) {
        if (userAgent.contains("ipad")
                || userAgent.contains("tablet")
                || (userAgent.contains("android") && !userAgent.contains("mobile"))) {
            return DeviceType.TABLET;
        }
        if (userAgent.contains("mobile") || userAgent.contains("iphone") || userAgent.contains("android")) {
            return DeviceType.MOBILE;
        }
        if (userAgent.contains("windows")
                || userAgent.contains("macintosh")
                || userAgent.contains("linux")
                || userAgent.contains("x11")) {
            return DeviceType.DESKTOP;
        }
        return DeviceType.OTHER;
    }
}
