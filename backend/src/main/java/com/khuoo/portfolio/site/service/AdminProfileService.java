package com.khuoo.portfolio.site.service;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.common.util.PortfolioEnums.ProfileEntryType;
import com.khuoo.portfolio.site.domain.ProfileEntry;
import com.khuoo.portfolio.site.dto.AdminProfileEntryResponse;
import com.khuoo.portfolio.site.dto.ProfileEntryCreateRequest;
import com.khuoo.portfolio.site.dto.ProfileEntryUpdateRequest;
import com.khuoo.portfolio.site.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;

// 관리자 프로필 반복 항목 생성·수정·삭제
@Service
@RequiredArgsConstructor
public class AdminProfileService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final SiteRepository siteRepository;
    private final AdminActionVerifier adminActionVerifier;

    // 요청값 검증과 재인증 후 프로필 항목 생성
    public AdminProfileEntryResponse create(
            ProfileEntryCreateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROFILE_ENTRY_CREATE,
                AdminActionTarget.PROFILE_ENTRY,
                null
        );

        ProfileEntry entry = ProfileEntry.create(
                request.entryType(),
                request.periodText(),
                request.title(),
                request.organization(),
                request.role(),
                request.description(),
                request.achievement(),
                request.featured() != null && request.featured(),
                request.displayOrder() == null ? 0 : request.displayOrder(),
                request.enabled() == null || request.enabled()
        );
        return AdminProfileEntryResponse.from(siteRepository.saveProfileEntry(entry));
    }

    // 대상과 PATCH 값을 검증한 뒤 재인증 후 프로필 항목 수정
    @Transactional(noRollbackFor = ApiException.class)
    public AdminProfileEntryResponse update(
            Long entryId,
            ProfileEntryUpdateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        ProfileEntry entry = requireEntry(entryId);
        PatchValues.requireAny(
                request.entryType(),
                request.periodText(),
                request.title(),
                request.organization(),
                request.role(),
                request.description(),
                request.achievement(),
                request.featured(),
                request.displayOrder(),
                request.enabled()
        );
        ProfileEntryType entryType = PatchValues.present(request.entryType())
                ? PatchValues.enumValue(request.entryType(), ProfileEntryType.class)
                : entry.getEntryType();
        String periodText = PatchValues.present(request.periodText())
                ? PatchValues.nullableString(request.periodText(), 100)
                : entry.getPeriodText();
        String title = PatchValues.present(request.title())
                ? PatchValues.requiredString(request.title(), 200)
                : entry.getTitle();
        String organization = PatchValues.present(request.organization())
                ? PatchValues.nullableString(request.organization(), 200)
                : entry.getOrganization();
        String role = PatchValues.present(request.role())
                ? PatchValues.nullableString(request.role(), 200)
                : entry.getRole();
        String description = PatchValues.present(request.description())
                ? PatchValues.nullableString(request.description(), -1)
                : entry.getDescription();
        String achievement = PatchValues.present(request.achievement())
                ? PatchValues.nullableString(request.achievement(), -1)
                : entry.getAchievement();
        boolean featured = PatchValues.present(request.featured())
                ? PatchValues.booleanValue(request.featured())
                : entry.isFeatured();
        int displayOrder = PatchValues.present(request.displayOrder())
                ? PatchValues.nonNegativeInt(request.displayOrder())
                : entry.getDisplayOrder();
        boolean enabled = PatchValues.present(request.enabled())
                ? PatchValues.booleanValue(request.enabled())
                : entry.isEnabled();

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROFILE_ENTRY_UPDATE,
                AdminActionTarget.PROFILE_ENTRY,
                entryId.toString()
        );
        entry.update(
                entryType,
                periodText,
                title,
                organization,
                role,
                description,
                achievement,
                featured,
                displayOrder,
                enabled,
                now()
        );
        return AdminProfileEntryResponse.from(entry);
    }

    // 대상 존재 확인과 재인증 후 프로필 항목 삭제
    @Transactional(noRollbackFor = ApiException.class)
    public void delete(Long entryId, AccountPrincipal currentAdmin, UUID challengeId, String code) {
        ProfileEntry entry = requireEntry(entryId);
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROFILE_ENTRY_DELETE,
                AdminActionTarget.PROFILE_ENTRY,
                entryId.toString()
        );
        siteRepository.deleteProfileEntry(entry);
    }

    private ProfileEntry requireEntry(Long entryId) {
        return siteRepository.findProfileEntry(entryId)
                .orElseThrow(() -> new ApiException(ErrorCode.PROFILE_ENTRY_NOT_FOUND));
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
