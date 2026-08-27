package com.khuoo.portfolio.authentication.service;

import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.util.Locale;

// 이메일 인증용 숫자 6자리 난수 생성
@Component
public class VerificationCodeGenerator {

    private static final int CODE_BOUND = 1_000_000;

    private final SecureRandom secureRandom = new SecureRandom();

    // 앞자리 0을 포함하는 숫자 6자리 인증번호 생성
    public String generate() {
        return String.format(Locale.ROOT, "%06d", secureRandom.nextInt(CODE_BOUND));
    }
}
