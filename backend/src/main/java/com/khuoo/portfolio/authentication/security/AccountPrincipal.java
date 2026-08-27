package com.khuoo.portfolio.authentication.security;

import com.khuoo.portfolio.account.domain.Account;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;

import java.io.Serializable;
import java.security.Principal;

// Spring Session에 저장되는 최소 계정 식별 정보
public record AccountPrincipal(
        Long id,
        String email,
        String name,
        AccountRole role
) implements Principal, Serializable {

    // 계정 Entity 기반 인증 주체 생성
    public static AccountPrincipal from(Account account) {
        return new AccountPrincipal(
                account.getId(),
                account.getEmail(),
                account.getName(),
                account.getRole()
        );
    }

    // Spring Session 계정 식별용 Principal 이름
    @Override
    public String getName() {
        return id.toString();
    }
}
