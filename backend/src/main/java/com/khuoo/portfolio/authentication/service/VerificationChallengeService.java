package com.khuoo.portfolio.authentication.service;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.account.repository.AccountRepository;
import com.khuoo.portfolio.authentication.domain.VerificationChallenge;
import com.khuoo.portfolio.authentication.dto.AdminActionChallengeRequest;
import com.khuoo.portfolio.authentication.dto.ChallengeResponse;
import com.khuoo.portfolio.authentication.repository.VerificationChallengeQueryRepository;
import com.khuoo.portfolio.authentication.repository.VerificationChallengeRepository;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengePurpose;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengeStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

// Challenge 발급·교체·발송 제한의 Transaction 관리
@Service
@RequiredArgsConstructor
public class VerificationChallengeService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final AccountRepository accountRepository;
    private final VerificationChallengeRepository challengeRepository;
    private final VerificationChallengeQueryRepository challengeQueryRepository;
    private final VerificationCodeGenerator codeGenerator;
    private final VerificationMailService mailService;
    private final PasswordEncoder passwordEncoder;

    // ADMIN Credential 성공 후 ADMIN_LOGIN Challenge 발급
    @Transactional
    public VerificationChallenge issueAdminLogin(Account account, boolean rememberMe) {
        OffsetDateTime now = now();
        verifySendLimit(account.getId(), now);
        replaceActive(account.getId(), ChallengePurpose.ADMIN_LOGIN, now);

        String code = codeGenerator.generate();
        VerificationChallenge challenge = VerificationChallenge.adminLogin(
                account.getId(),
                passwordEncoder.encode(code),
                rememberMe,
                now
        );
        challengeRepository.save(challenge);
        mailService.send(account.getEmail(), ChallengePurpose.ADMIN_LOGIN, code);
        return challenge;
    }

    // 기존 ADMIN_LOGIN Challenge 기반 인증번호 재발급
    @Transactional
    public ChallengeResponse resendAdminLogin(UUID challengeId) {
        OffsetDateTime now = now();
        VerificationChallenge source = challengeRepository.findByIdForUpdate(challengeId)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_CHALLENGE_NOT_FOUND));
        if (source.getPurpose() != ChallengePurpose.ADMIN_LOGIN
                || source.getStatus() == ChallengeStatus.USED
                || source.getStatus() == ChallengeStatus.REPLACED) {
            throw new ApiException(ErrorCode.AUTH_CHALLENGE_CONFLICT);
        }
        if (!source.canResend(now)) {
            throw new ApiException(ErrorCode.AUTH_RESEND_TOO_SOON);
        }

        Account account = accountRepository.findById(source.getAccountId())
                .filter(Account::isEnabled)
                .filter(candidate -> candidate.getRole() == AccountRole.ADMIN)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_CHALLENGE_CONFLICT));
        verifySendLimit(account.getId(), now);

        String code = codeGenerator.generate();
        VerificationChallenge replacement = VerificationChallenge.adminLogin(
                account.getId(),
                passwordEncoder.encode(code),
                source.isRememberMe(),
                now
        );
        source.replace(now);
        challengeRepository.save(replacement);
        mailService.send(account.getEmail(), ChallengePurpose.ADMIN_LOGIN, code);
        return ChallengeResponse.from(replacement);
    }

    // 현재 계정 PASSWORD_CHANGE Challenge 발급
    @Transactional
    public ChallengeResponse issuePasswordChange(Long accountId) {
        Account account = requireEnabledAccount(accountId);
        OffsetDateTime now = now();
        verifySendLimit(accountId, now);
        replaceActive(accountId, ChallengePurpose.PASSWORD_CHANGE, now);

        String code = codeGenerator.generate();
        VerificationChallenge challenge = VerificationChallenge.passwordChange(
                accountId,
                passwordEncoder.encode(code),
                now
        );
        challengeRepository.save(challenge);
        mailService.send(account.getEmail(), ChallengePurpose.PASSWORD_CHANGE, code);
        return ChallengeResponse.from(challenge);
    }

    // 현재 ADMIN 계정과 작업에 바인딩된 ADMIN_ACTION Challenge 발급
    @Transactional
    public ChallengeResponse issueAdminAction(Long accountId, AdminActionChallengeRequest request) {
        Account account = requireEnabledAccount(accountId);
        if (account.getRole() != AccountRole.ADMIN) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN);
        }

        OffsetDateTime now = now();
        verifySendLimit(accountId, now);
        replaceActive(accountId, ChallengePurpose.ADMIN_ACTION, now);

        String code = codeGenerator.generate();
        VerificationChallenge challenge = VerificationChallenge.adminAction(
                accountId,
                request.operation(),
                request.targetType(),
                request.targetId(),
                passwordEncoder.encode(code),
                now
        );
        challengeRepository.save(challenge);
        mailService.send(account.getEmail(), ChallengePurpose.ADMIN_ACTION, code);
        return ChallengeResponse.from(challenge);
    }

    private Account requireEnabledAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .filter(Account::isEnabled)
                .orElseThrow(() -> new ApiException(ErrorCode.AUTH_UNAUTHORIZED));
    }

    private void verifySendLimit(Long accountId, OffsetDateTime now) {
        long createdCount = challengeQueryRepository.countCreatedSince(
                accountId,
                now.minus(PortfolioConstants.Authentication.CHALLENGE_SEND_WINDOW)
        );
        if (createdCount >= PortfolioConstants.Authentication.CHALLENGE_SEND_LIMIT) {
            throw new ApiException(ErrorCode.AUTH_CHALLENGE_RATE_LIMITED);
        }
    }

    private void replaceActive(Long accountId, ChallengePurpose purpose, OffsetDateTime now) {
        challengeQueryRepository.findActiveForUpdate(accountId, purpose)
                .forEach(challenge -> challenge.replace(now));
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
