package com.khuoo.portfolio.authentication.service;

import com.khuoo.portfolio.authentication.domain.ChallengeVerificationResult;
import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioEnums.AccountRole;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.common.util.PortfolioEnums.ChallengePurpose;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.ServletRequestAttributes;
import org.springframework.stereotype.Service;

import java.util.UUID;

// 향후 관리자 변경 API에서 명시적으로 호출할 작업별 재인증 검증
@Service
@RequiredArgsConstructor
public class AdminActionVerifier {

    private final ChallengeVerifier challengeVerifier;
    private final AdminActionGraceService graceService;

    /**
     * 현재 ADMIN과 작업 바인딩이 일치하는 Challenge 검증 및 일회성 소모
     *
     * @param currentAdmin 현재 ADMIN 인증 주체
     * @param challengeId Challenge 식별자
     * @param code 이메일 인증번호
     * @param operation 예상 관리자 작업
     * @param targetType 예상 작업 대상 종류
     * @param targetId 예상 작업 대상 식별자
     */
    public void verifyAndConsume(
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code,
            AdminActionOperation operation,
            AdminActionTarget targetType,
            String targetId
    ) {
        verifyAndConsume(currentRequest(), currentAdmin, challengeId, code, operation, targetType, targetId);
    }

    // 관리자 작업의 헤더 유무에 따른 재인증 또는 세션 유예 검증
    public void verifyAndConsume(
            HttpServletRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code,
            AdminActionOperation operation,
            AdminActionTarget targetType,
            String targetId
    ) {
        if (currentAdmin == null || currentAdmin.role() != AccountRole.ADMIN) {
            throw new ApiException(ErrorCode.AUTH_FORBIDDEN);
        }

        boolean challengeProvided = challengeId != null;
        boolean codeProvided = code != null;
        if (challengeProvided != codeProvided) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        if (!challengeProvided) {
            if (graceService.isActive(request, currentAdmin)) {
                return;
            }
            throw new ApiException(ErrorCode.AUTH_ADMIN_ACTION_REAUTH_REQUIRED);
        }

        ChallengeVerificationResult result = challengeVerifier.verifyAndConsume(
                challengeId,
                code,
                ChallengePurpose.ADMIN_ACTION,
                currentAdmin.id(),
                operation,
                targetType,
                targetId
        );
        if (!result.isSuccess()) {
            throw new ApiException(ErrorCode.AUTH_ADMIN_ACTION_MISMATCH);
        }
        if (request != null) {
            graceService.grant(request, currentAdmin);
        }
    }

    private HttpServletRequest currentRequest() {
        RequestAttributes attributes = RequestContextHolder.getRequestAttributes();
        if (attributes instanceof ServletRequestAttributes servletAttributes) {
            return servletAttributes.getRequest();
        }
        return null;
    }
}
