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
import com.khuoo.portfolio.site.dto.ProfileEntryOrderBatchRequest;
import com.khuoo.portfolio.site.dto.ProfileEntryOrderBatchResponse;
import com.khuoo.portfolio.site.dto.ProfileEntryOrderRequest;
import com.khuoo.portfolio.site.dto.ProfileEntryOrderResponse;
import com.khuoo.portfolio.site.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;
import java.util.Collection;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

// 관리자 프로필 반복 항목 생성·수정·삭제
@Service
@RequiredArgsConstructor
public class AdminProfileService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final SiteRepository siteRepository;
    private final AdminActionVerifier adminActionVerifier;

    // 요청값 검증과 재인증 후 프로필 항목 생성
    @Transactional(noRollbackFor = ApiException.class)
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

        List<ProfileEntry> currentGroup = siteRepository.findProfileEntriesForUpdate(
                groupTypes(groupFor(request.entryType()))
        );
        int nextOrder = currentGroup.stream().mapToInt(ProfileEntry::getDisplayOrder).max().orElse(0) + 1;
        ProfileEntry entry = ProfileEntry.create(
                request.entryType(),
                request.periodText(),
                request.title(),
                request.organization(),
                request.role(),
                request.description(),
                request.achievement(),
                nextOrder,
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
        ProfileEntryType previousType = entry.getEntryType();
        entry.update(
                entryType,
                periodText,
                title,
                organization,
                role,
                description,
                achievement,
                entry.getDisplayOrder(),
                enabled,
                now()
        );
        if (previousType != entryType) {
            ProfileEntryOrderRequest.ProfileOrderGroup previousGroup = groupFor(previousType);
            ProfileEntryOrderRequest.ProfileOrderGroup nextGroup = groupFor(entryType);
            normalizeGroup(previousGroup);
            if (nextGroup != previousGroup) {
                normalizeGroup(nextGroup);
            }
        }
        return AdminProfileEntryResponse.from(entry);
    }

    // 관리자 재인증 후 프로필 그룹의 전체 순서 일괄 저장
    @Transactional(noRollbackFor = ApiException.class)
    public ProfileEntryOrderResponse reorder(
            ProfileEntryOrderRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROFILE_ENTRIES_REORDER,
                AdminActionTarget.PROFILE_ENTRY,
                null
        );
        List<ProfileEntry> entries = siteRepository.findProfileEntriesForUpdate(groupTypes(request.group()));
        List<Long> currentIds = entries.stream().map(ProfileEntry::getId).toList();
        validateOrder(currentIds, request.expectedIds(), request.orderedIds());
        Map<Long, ProfileEntry> byId = entries.stream().collect(Collectors.toMap(ProfileEntry::getId, Function.identity()));
        OffsetDateTime changedAt = now();
        for (int index = 0; index < request.orderedIds().size(); index++) {
            byId.get(request.orderedIds().get(index)).changeDisplayOrder(index + 1, changedAt);
        }
        siteRepository.flush();
        return new ProfileEntryOrderResponse(request.orderedIds().stream().map(byId::get).map(AdminProfileEntryResponse::from).toList());
    }

    // 관리자 재인증 후 변경된 여러 프로필 그룹의 표시 순서 일괄 저장
    @Transactional(noRollbackFor = ApiException.class)
    public ProfileEntryOrderBatchResponse reorderBatch(
            ProfileEntryOrderBatchRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PROFILE_ENTRIES_REORDER,
                AdminActionTarget.PROFILE_ENTRY,
                null
        );
        Set<ProfileEntryOrderRequest.ProfileOrderGroup> requestedGroups = request.groups().stream()
                .map(ProfileEntryOrderRequest::group)
                .collect(Collectors.toSet());
        if (requestedGroups.size() != request.groups().size()) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }

        Map<ProfileEntryOrderRequest.ProfileOrderGroup, List<ProfileEntry>> entriesByGroup = new LinkedHashMap<>();
        for (ProfileEntryOrderRequest groupRequest : request.groups()) {
            List<ProfileEntry> entries = siteRepository.findProfileEntriesForUpdate(groupTypes(groupRequest.group()));
            List<Long> currentIds = entries.stream().map(ProfileEntry::getId).toList();
            validateOrder(currentIds, groupRequest.expectedIds(), groupRequest.orderedIds());
            entriesByGroup.put(groupRequest.group(), entries);
        }

        OffsetDateTime changedAt = now();
        for (ProfileEntryOrderRequest groupRequest : request.groups()) {
            Map<Long, ProfileEntry> byId = entriesByGroup.get(groupRequest.group()).stream()
                    .collect(Collectors.toMap(ProfileEntry::getId, Function.identity()));
            for (int index = 0; index < groupRequest.orderedIds().size(); index++) {
                byId.get(groupRequest.orderedIds().get(index)).changeDisplayOrder(index + 1, changedAt);
            }
        }
        siteRepository.flush();
        List<AdminProfileEntryResponse> items = entriesByGroup.values().stream()
                .flatMap(Collection::stream)
                .map(AdminProfileEntryResponse::from)
                .toList();
        return new ProfileEntryOrderBatchResponse(items);
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
        ProfileEntryOrderRequest.ProfileOrderGroup group = groupFor(entry.getEntryType());
        siteRepository.deleteProfileEntry(entry);
        normalizeGroup(group);
    }

    private ProfileEntry requireEntry(Long entryId) {
        return siteRepository.findProfileEntry(entryId)
                .orElseThrow(() -> new ApiException(ErrorCode.PROFILE_ENTRY_NOT_FOUND));
    }

    private void normalizeGroup(ProfileEntryOrderRequest.ProfileOrderGroup group) {
        List<ProfileEntry> entries = siteRepository.findProfileEntriesForUpdate(groupTypes(group));
        OffsetDateTime changedAt = now();
        for (int index = 0; index < entries.size(); index++) {
            entries.get(index).changeDisplayOrder(index + 1, changedAt);
        }
        siteRepository.flush();
    }

    private ProfileEntryOrderRequest.ProfileOrderGroup groupFor(ProfileEntryType entryType) {
        return switch (entryType) {
            case EDUCATION -> ProfileEntryOrderRequest.ProfileOrderGroup.EDUCATION;
            case EXPERIENCE, ACTIVITY -> ProfileEntryOrderRequest.ProfileOrderGroup.ACTIVITIES;
            case AWARD -> ProfileEntryOrderRequest.ProfileOrderGroup.AWARD;
            case CERTIFICATE -> ProfileEntryOrderRequest.ProfileOrderGroup.CERTIFICATE;
        };
    }

    private List<ProfileEntryType> groupTypes(ProfileEntryOrderRequest.ProfileOrderGroup group) {
        return switch (group) {
            case EDUCATION -> List.of(ProfileEntryType.EDUCATION);
            case ACTIVITIES -> List.of(ProfileEntryType.EXPERIENCE, ProfileEntryType.ACTIVITY);
            case AWARD -> List.of(ProfileEntryType.AWARD);
            case CERTIFICATE -> List.of(ProfileEntryType.CERTIFICATE);
        };
    }

    private void validateOrder(List<Long> currentIds, List<Long> expectedIds, List<Long> orderedIds) {
        if (!isPermutation(currentIds, expectedIds) || !isPermutation(currentIds, orderedIds)) {
            throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
        }
        if (!Objects.equals(currentIds, expectedIds)) {
            throw new ApiException(ErrorCode.ORDER_CONFLICT);
        }
    }

    private boolean isPermutation(List<Long> currentIds, List<Long> requestedIds) {
        return requestedIds != null
                && requestedIds.size() == currentIds.size()
                && Set.copyOf(requestedIds).size() == requestedIds.size()
                && Set.copyOf(requestedIds).equals(Set.copyOf(currentIds));
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
