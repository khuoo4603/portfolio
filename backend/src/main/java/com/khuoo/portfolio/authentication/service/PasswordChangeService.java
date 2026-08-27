package com.khuoo.portfolio.authentication.service;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.account.repository.AccountRepository;
import com.khuoo.portfolio.authentication.domain.ChallengeVerificationResult;
import com.khuoo.portfolio.authentication.dto.PasswordChangeRequest;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengePurpose;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;

// PASSWORD_CHANGE 검증과 Account 비밀번호 변경 Transaction 관리
@Service
@RequiredArgsConstructor
public class PasswordChangeService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final AccountRepository accountRepository;
    private final ChallengeVerifier challengeVerifier;
    private final PasswordEncoder passwordEncoder;

    // 비밀번호 정책과 Challenge 검증 성공 시 BCrypt Hash 변경
    @Transactional
    public ChallengeVerificationResult change(Long accountId, PasswordChangeRequest request) {
        Account account = accountRepository.findById(accountId)
                .filter(Account::isEnabled)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_UNAUTHORIZED));
        validatePassword(account, request.newPassword());

        ChallengeVerificationResult result = challengeVerifier.verifyAndConsume(
                request.challengeId(),
                request.code(),
                ChallengePurpose.PASSWORD_CHANGE,
                accountId,
                null,
                null,
                null
        );
        if (result.isSuccess()) {
            account.changePassword(
                    passwordEncoder.encode(request.newPassword()),
                    OffsetDateTime.now(SERVICE_ZONE)
            );
        }
        return result;
    }

    private void validatePassword(Account account, String newPassword) {
        if (!newPassword.equals(newPassword.trim())
                || newPassword.equalsIgnoreCase(account.getEmail())) {
            throw new ApiException(ErrorCode.AUTH_PASSWORD_POLICY);
        }
    }
}
