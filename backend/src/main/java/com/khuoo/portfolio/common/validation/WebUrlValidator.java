package com.khuoo.portfolio.common.validation;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import org.springframework.stereotype.Component;

import java.net.URI;
import java.net.URISyntaxException;

// HTTP·HTTPS 외부 URL 공통 검증
@Component
public class WebUrlValidator {

    // Host를 포함한 HTTP·HTTPS URL 검증
    public void validate(String value) {
        if (value == null) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        try {
            URI uri = new URI(value);
            String scheme = uri.getScheme();
            if (uri.isOpaque()
                    || uri.getHost() == null
                    || scheme == null
                    || !(scheme.equalsIgnoreCase("http") || scheme.equalsIgnoreCase("https"))) {
                throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
            }
        } catch (URISyntaxException exception) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR, exception);
        }
    }
}
