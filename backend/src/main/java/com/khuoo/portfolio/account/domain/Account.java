package com.khuoo.portfolio.account.domain;

import com.khuoo.portfolio.common.util.EmailNormalizer;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;

// 인증과 권한 판단에 사용하는 계정 상태
@Getter
@Entity
@Table(name = "accounts")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Account {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 255)
    private String email;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private AccountRole role;

    @Column(nullable = false)
    private boolean enabled;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false, insertable = false)
    private OffsetDateTime updatedAt;

    private Account(
            String email,
            String name,
            String passwordHash,
            AccountRole role,
            boolean enabled
    ) {
        this.email = EmailNormalizer.normalize(email);
        this.name = name;
        this.passwordHash = passwordHash;
        this.role = role;
        this.enabled = enabled;
    }

    // 관리자 계정 관리용 신규 Account 생성
    public static Account create(
            String email,
            String name,
            String passwordHash,
            AccountRole role,
            boolean enabled
    ) {
        return new Account(email, name, passwordHash, role, enabled);
    }

    // 계정 활성 상태 변경 여부 반환
    public boolean changeEnabled(boolean newEnabled, OffsetDateTime changedAt) {
        if (enabled == newEnabled) {
            return false;
        }
        enabled = newEnabled;
        updatedAt = changedAt;
        return true;
    }

    // 계정 권한 변경 여부 반환
    public boolean changeRole(AccountRole newRole, OffsetDateTime changedAt) {
        if (role == newRole) {
            return false;
        }
        role = newRole;
        updatedAt = changedAt;
        return true;
    }

    // 새 BCrypt Hash 기반 비밀번호 변경
    public void changePassword(String newPasswordHash, OffsetDateTime changedAt) {
        passwordHash = newPasswordHash;
        updatedAt = changedAt;
    }

    // 저장 전 이메일 비교 기준 정규화
    @PrePersist
    @PreUpdate
    private void normalizeEmail() {
        email = EmailNormalizer.normalize(email);
    }
}
