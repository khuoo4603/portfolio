package com.khuoo.portfolio.authentication.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengePurpose;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

// 이메일 Challenge 인증번호 발송
@Service
@RequiredArgsConstructor
public class VerificationMailService {

    private final JavaMailSender mailSender;

    @Value("${portfolio.mail.from:}")
    private String from;

    // 목적별 제목과 5분 유효 안내를 포함한 인증번호 발송
    public void send(String email, ChallengePurpose purpose, String code) {
        SimpleMailMessage message = new SimpleMailMessage();
        if (from != null && !from.isBlank()) {
            message.setFrom(from);
        }
        message.setTo(email);
        message.setSubject(subject(purpose));
        message.setText("인증번호: " + code + System.lineSeparator()
                + "이 인증번호는 5분 내에 한 번만 사용할 수 있습니다.");

        try {
            mailSender.send(message);
        } catch (MailException exception) {
            throw new ApiException(ErrorCode.AUTH_MAIL_UNAVAILABLE, exception);
        }
    }

    private String subject(ChallengePurpose purpose) {
        return switch (purpose) {
            case ADMIN_LOGIN -> "포트폴리오 관리자 로그인 인증번호";
            case PASSWORD_CHANGE -> "포트폴리오 비밀번호 변경 인증번호";
            case ADMIN_ACTION -> "포트폴리오 관리자 작업 인증번호";
        };
    }
}
