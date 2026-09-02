package com.khuoo.portfolio.authentication.domain;

import com.khuoo.portfolio.common.util.PortfolioEnums.DeviceType;

// 로그인 기록에 사용하는 정규화 Client 정보
public record ClientInfo(
        String ipAddress,
        String userAgent,
        String browser,
        String operatingSystem,
        DeviceType device
) {
}
