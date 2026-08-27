package com.khuoo.portfolio.common.validation;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import org.springframework.stereotype.Component;

// 계정 생성·변경·초기화 공통 비밀번호 정책 검증
@Component
public class PasswordPolicyValidator {

    /**
     * 길이·앞뒤 공백·이메일 동일 여부 검증
     *
     * @param email 정규화 계정 이메일
     * @param password 검증 대상 비밀번호 원문
     * @throws ApiException 비밀번호 정책 위반
     */
    public void validate(String email, String password) {
        if (password == null
                || password.length() < 8
                || password.length() > 64
                || !password.equals(password.trim())
                || password.equalsIgnoreCase(email)) {
            throw new ApiException(ErrorCode.AUTH_PASSWORD_POLICY);
        }
    }
}
