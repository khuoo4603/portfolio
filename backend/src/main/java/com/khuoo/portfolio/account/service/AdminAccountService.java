package com.khuoo.portfolio.account.service;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.account.dto.AccountCreateRequest;
import com.khuoo.portfolio.account.dto.AccountCreateResponse;
import com.khuoo.portfolio.account.dto.AccountPasswordResetRequest;
import com.khuoo.portfolio.account.dto.AccountRoleRequest;
import com.khuoo.portfolio.account.dto.AccountRoleResponse;
import com.khuoo.portfolio.account.dto.AccountStatusRequest;
import com.khuoo.portfolio.account.dto.AccountStatusResponse;
import com.khuoo.portfolio.account.dto.AdminAccountItemResponse;
import com.khuoo.portfolio.account.dto.AdminAccountListResponse;
import com.khuoo.portfolio.account.repository.AccountQueryRepository;
import com.khuoo.portfolio.account.repository.AccountRepository;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AccountSessionService;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.EmailNormalizer;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.common.validation.PasswordPolicyValidator;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

// 관리자 계정 조회·생성·상태·권한·비밀번호 관리
@Service
@RequiredArgsConstructor
public class AdminAccountService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final AccountRepository accountRepository;
    private final AccountQueryRepository accountQueryRepository;
    private final AdminActionVerifier adminActionVerifier;
    private final AccountSessionService accountSessionService;
    private final PasswordPolicyValidator passwordPolicyValidator;
    private final PasswordEncoder passwordEncoder;

    // 선택 필터와 최근 로그인시각을 포함한 관리자 계정 목록 조회
    public AdminAccountListResponse findAll(AccountRole role, Boolean enabled, String keyword) {
        return new AdminAccountListResponse(
                accountQueryRepository.findAll(role, enabled, keyword).stream()
                        .map(AdminAccountItemResponse::from)
                        .toList()
        );
    }

    // ADMIN_ACTION 검증 후 신규 계정 생성
    public AccountCreateResponse create(
            AccountCreateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        String email = EmailNormalizer.normalize(request.email());
        passwordPolicyValidator.validate(email, request.password());
        if (accountRepository.existsByEmail(email)) {
            throw new ApiException(ErrorCode.ACCOUNT_EMAIL_CONFLICT);
        }

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.ACCOUNT_CREATE,
                AdminActionTarget.ACCOUNT,
                null
        );

        Account account = Account.create(
                email,
                request.name(),
                passwordEncoder.encode(request.password()),
                request.role(),
                request.enabled() == null || request.enabled()
        );
        try {
            return AccountCreateResponse.from(accountRepository.save(account));
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(ErrorCode.ACCOUNT_EMAIL_CONFLICT, exception);
        }
    }

    // 마지막 ADMIN 보호와 재인증 후 계정 활성 상태 변경
    @Transactional(noRollbackFor = ApiException.class)
    public AccountStatusResponse changeStatus(
            Long accountId,
            AccountStatusRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        Account account = requireAccount(accountId);
        if (account.getRole() == AccountRole.ADMIN && account.isEnabled() && !request.enabled()) {
            protectLastAdmin();
        }

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.ACCOUNT_STATUS_UPDATE,
                AdminActionTarget.ACCOUNT,
                accountId.toString()
        );

        boolean changed = account.changeEnabled(request.enabled(), now());
        if (changed && !request.enabled()) {
            accountSessionService.expireAll(accountId);
        }
        return AccountStatusResponse.from(account);
    }

    // 마지막 ADMIN 보호와 재인증 후 계정 권한 변경
    @Transactional(noRollbackFor = ApiException.class)
    public AccountRoleResponse changeRole(
            Long accountId,
            AccountRoleRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        Account account = requireAccount(accountId);
        if (account.getRole() == AccountRole.ADMIN
                && account.isEnabled()
                && request.role() == AccountRole.USER) {
            protectLastAdmin();
        }

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.ACCOUNT_ROLE_UPDATE,
                AdminActionTarget.ACCOUNT,
                accountId.toString()
        );

        if (account.changeRole(request.role(), now())) {
            accountSessionService.expireAll(accountId);
        }
        return AccountRoleResponse.from(account);
    }

    // 재인증과 공통 Password 정책 검증 후 대상 비밀번호 초기화
    @Transactional(noRollbackFor = ApiException.class)
    public void resetPassword(
            Long accountId,
            AccountPasswordResetRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        Account account = requireAccount(accountId);
        passwordPolicyValidator.validate(account.getEmail(), request.newPassword());
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.ACCOUNT_PASSWORD_RESET,
                AdminActionTarget.ACCOUNT,
                accountId.toString()
        );

        account.changePassword(passwordEncoder.encode(request.newPassword()), now());
        accountSessionService.expireAll(accountId);
    }

    private Account requireAccount(Long accountId) {
        return accountRepository.findById(accountId)
                .orElseThrow(() -> new ApiException(ErrorCode.ACCOUNT_NOT_FOUND));
    }

    private void protectLastAdmin() {
        if (accountRepository.lockActiveAdmins().size() <= 1) {
            throw new ApiException(ErrorCode.ACCOUNT_LAST_ADMIN_PROTECTED);
        }
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
