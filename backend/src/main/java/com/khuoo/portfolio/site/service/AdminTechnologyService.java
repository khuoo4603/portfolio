package com.khuoo.portfolio.site.service;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.common.util.PortfolioEnums.TechnologyCategory;
import com.khuoo.portfolio.site.domain.Technology;
import com.khuoo.portfolio.site.dto.TechnologyCreateRequest;
import com.khuoo.portfolio.site.dto.TechnologyMasterResponse;
import com.khuoo.portfolio.site.dto.TechnologyUpdateRequest;
import com.khuoo.portfolio.site.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

// 관리자 기술 사전 생성·수정·삭제
@Service
@RequiredArgsConstructor
public class AdminTechnologyService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final SiteRepository siteRepository;
    private final AdminActionVerifier adminActionVerifier;

    // 기술명 중복 검증과 재인증 후 기술 사전 항목 생성
    public TechnologyMasterResponse create(
            TechnologyCreateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        if (siteRepository.existsTechnologyName(request.name(), null)) {
            throw new ApiException(ErrorCode.TECHNOLOGY_NAME_CONFLICT);
        }
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.TECHNOLOGY_CREATE,
                AdminActionTarget.TECHNOLOGY,
                null
        );

        Technology technology = Technology.create(
                request.name(),
                request.category(),
                request.iconUrl(),
                request.enabled() == null || request.enabled()
        );
        try {
            return TechnologyMasterResponse.from(siteRepository.saveTechnology(technology));
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(ErrorCode.TECHNOLOGY_NAME_CONFLICT, exception);
        }
    }

    // 대상과 PATCH 값을 검증한 뒤 재인증 후 기술 사전 항목 수정
    @Transactional(noRollbackFor = ApiException.class)
    public TechnologyMasterResponse update(
            Long technologyId,
            TechnologyUpdateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        Technology technology = requireTechnology(technologyId);
        PatchValues.requireAny(
                request.name(),
                request.category(),
                request.iconUrl(),
                request.enabled()
        );
        String name = PatchValues.present(request.name())
                ? PatchValues.requiredString(request.name(), 100)
                : technology.getName();
        TechnologyCategory category = PatchValues.present(request.category())
                ? PatchValues.enumValue(request.category(), TechnologyCategory.class)
                : technology.getCategory();
        String iconUrl = PatchValues.present(request.iconUrl())
                ? PatchValues.nullableString(request.iconUrl(), -1)
                : technology.getIconUrl();
        boolean enabled = PatchValues.present(request.enabled())
                ? PatchValues.booleanValue(request.enabled())
                : technology.isEnabled();

        if (siteRepository.existsTechnologyName(name, technologyId)) {
            throw new ApiException(ErrorCode.TECHNOLOGY_NAME_CONFLICT);
        }
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.TECHNOLOGY_UPDATE,
                AdminActionTarget.TECHNOLOGY,
                technologyId.toString()
        );

        technology.update(name, category, iconUrl, enabled, now());
        try {
            siteRepository.flush();
        } catch (DataIntegrityViolationException exception) {
            throw new ApiException(ErrorCode.TECHNOLOGY_NAME_CONFLICT, exception);
        }
        return TechnologyMasterResponse.from(technology);
    }

    // 대상 존재 확인과 재인증 후 FK Cascade 기반 기술 삭제
    @Transactional(noRollbackFor = ApiException.class)
    public void delete(Long technologyId, AccountPrincipal currentAdmin, UUID challengeId, String code) {
        Technology technology = requireTechnology(technologyId);
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.TECHNOLOGY_DELETE,
                AdminActionTarget.TECHNOLOGY,
                technologyId.toString()
        );
        siteRepository.deleteTechnology(technology);
    }

    private Technology requireTechnology(Long technologyId) {
        return siteRepository.findTechnology(technologyId)
                .orElseThrow(() -> new ApiException(ErrorCode.TECHNOLOGY_NOT_FOUND));
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
