package com.khuoo.portfolio.authentication.domain;

import com.khuoo.portfolio.common.util.PortfolioConstants;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengePurpose;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengeStatus;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

// 이메일 인증번호와 작업 바인딩을 보관하는 일회성 Challenge
@Getter
@Entity
@Table(name = "verification_challenges")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class VerificationChallenge {

    @Id
    private UUID id;

    @Column(name = "account_id", nullable = false)
    private Long accountId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 30)
    private ChallengePurpose purpose;

    @Enumerated(EnumType.STRING)
    @Column(length = 60)
    private AdminActionOperation operation;

    @Enumerated(EnumType.STRING)
    @Column(name = "target_type", length = 30)
    private AdminActionTarget targetType;

    @Column(name = "target_id", length = 100)
    private String targetId;

    @Column(name = "code_hash", nullable = false, length = 255)
    private String codeHash;

    @Column(name = "remember_me", nullable = false)
    private boolean rememberMe;

    @Column(name = "failed_attempts", nullable = false)
    private short failedAttempts;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private ChallengeStatus status;

    @Column(name = "expires_at", nullable = false)
    private OffsetDateTime expiresAt;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    private VerificationChallenge(
            Long accountId,
            ChallengePurpose purpose,
            AdminActionOperation operation,
            AdminActionTarget targetType,
            String targetId,
            String codeHash,
            boolean rememberMe,
            OffsetDateTime createdAt
    ) {
        this.id = UUID.randomUUID();
        this.accountId = accountId;
        this.purpose = purpose;
        this.operation = operation;
        this.targetType = targetType;
        this.targetId = targetId;
        this.codeHash = codeHash;
        this.rememberMe = rememberMe;
        this.failedAttempts = 0;
        this.status = ChallengeStatus.ACTIVE;
        this.expiresAt = createdAt.plus(PortfolioConstants.Authentication.CHALLENGE_VALIDITY);
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
    }

    // ADMIN_LOGIN Challenge 생성
    public static VerificationChallenge adminLogin(
            Long accountId,
            String codeHash,
            boolean rememberMe,
            OffsetDateTime createdAt
    ) {
        return new VerificationChallenge(
                accountId,
                ChallengePurpose.ADMIN_LOGIN,
                null,
                null,
                null,
                codeHash,
                rememberMe,
                createdAt
        );
    }

    // PASSWORD_CHANGE Challenge 생성
    public static VerificationChallenge passwordChange(
            Long accountId,
            String codeHash,
            OffsetDateTime createdAt
    ) {
        return new VerificationChallenge(
                accountId,
                ChallengePurpose.PASSWORD_CHANGE,
                null,
                null,
                null,
                codeHash,
                false,
                createdAt
        );
    }

    // ADMIN_ACTION Challenge 생성
    public static VerificationChallenge adminAction(
            Long accountId,
            AdminActionOperation operation,
            AdminActionTarget targetType,
            String targetId,
            String codeHash,
            OffsetDateTime createdAt
    ) {
        return new VerificationChallenge(
                accountId,
                ChallengePurpose.ADMIN_ACTION,
                operation,
                targetType,
                targetId,
                codeHash,
                false,
                createdAt
        );
    }

    // 현재 시각 기준 인증번호 만료 여부
    public boolean isExpired(OffsetDateTime now) {
        return !now.isBefore(expiresAt);
    }

    // 재전송 대기시간 경과 여부
    public boolean canResend(OffsetDateTime now) {
        return !now.isBefore(createdAt.plus(PortfolioConstants.Authentication.CHALLENGE_RESEND_DELAY));
    }

    // 인증 실패 횟수 증가와 한도 도달 시 잠금 전환
    public boolean recordFailure(OffsetDateTime now) {
        failedAttempts++;
        updatedAt = now;
        if (failedAttempts >= PortfolioConstants.Authentication.CHALLENGE_FAILURE_LIMIT) {
            status = ChallengeStatus.LOCKED;
            return true;
        }
        return false;
    }

    // 검증 성공 Challenge 일회성 소모
    public void use(OffsetDateTime now) {
        status = ChallengeStatus.USED;
        updatedAt = now;
    }

    // 신규 인증번호 발급에 따른 기존 Challenge 교체
    public void replace(OffsetDateTime now) {
        status = ChallengeStatus.REPLACED;
        updatedAt = now;
    }
}
