package com.khuoo.portfolio.site.service;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.common.validation.WebUrlValidator;
import com.khuoo.portfolio.site.domain.ExternalLink;
import com.khuoo.portfolio.site.dto.AdminExternalLinkResponse;
import com.khuoo.portfolio.site.dto.ExternalLinkCreateRequest;
import com.khuoo.portfolio.site.dto.ExternalLinkUpdateRequest;
import com.khuoo.portfolio.site.dto.ExternalLinkOrderRequest;
import com.khuoo.portfolio.site.dto.ExternalLinkOrderResponse;
import com.khuoo.portfolio.site.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

// 관리자 포트폴리오 외부 링크 생성·수정·삭제
@Service
@RequiredArgsConstructor
public class AdminExternalLinkService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final SiteRepository siteRepository;
    private final AdminActionVerifier adminActionVerifier;
    private final WebUrlValidator webUrlValidator;

    // Web URL 검증과 재인증 후 외부 링크 생성
    @Transactional(noRollbackFor = ApiException.class)
    public AdminExternalLinkResponse create(
            ExternalLinkCreateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        webUrlValidator.validate(request.url());
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.EXTERNAL_LINK_CREATE,
                AdminActionTarget.EXTERNAL_LINK,
                null
        );

        int nextOrder = siteRepository.findExternalLinksForUpdate().stream()
                .mapToInt(ExternalLink::getDisplayOrder)
                .max()
                .orElse(0) + 1;
        ExternalLink link = ExternalLink.create(
                request.name(),
                request.url(),
                nextOrder,
                request.enabled() == null || request.enabled()
        );
        return AdminExternalLinkResponse.from(siteRepository.saveExternalLink(link));
    }

    // 대상과 PATCH 값을 검증한 뒤 재인증 후 외부 링크 수정
    @Transactional(noRollbackFor = ApiException.class)
    public AdminExternalLinkResponse update(
            Long linkId,
            ExternalLinkUpdateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        ExternalLink link = requireLink(linkId);
        PatchValues.requireAny(
                request.name(),
                request.url(),
                request.enabled()
        );
        String name = PatchValues.present(request.name())
                ? PatchValues.requiredString(request.name(), 100)
                : link.getName();
        String url = PatchValues.present(request.url())
                ? PatchValues.requiredString(request.url(), Integer.MAX_VALUE)
                : link.getUrl();
        boolean enabled = PatchValues.present(request.enabled())
                ? PatchValues.booleanValue(request.enabled())
                : link.isEnabled();
        webUrlValidator.validate(url);

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.EXTERNAL_LINK_UPDATE,
                AdminActionTarget.EXTERNAL_LINK,
                linkId.toString()
        );
        link.update(name, url, link.getDisplayOrder(), enabled, now());
        return AdminExternalLinkResponse.from(link);
    }

    // 관리자 재인증 후 외부 링크 전체 순서 일괄 저장
    @Transactional(noRollbackFor = ApiException.class)
    public ExternalLinkOrderResponse reorder(
            ExternalLinkOrderRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.EXTERNAL_LINKS_REORDER,
                AdminActionTarget.EXTERNAL_LINK,
                null
        );
        List<ExternalLink> links = siteRepository.findExternalLinksForUpdate();
        List<Long> currentIds = links.stream().map(ExternalLink::getId).toList();
        validateOrder(currentIds, request.expectedIds(), request.orderedIds());
        Map<Long, ExternalLink> byId = links.stream().collect(Collectors.toMap(ExternalLink::getId, Function.identity()));
        OffsetDateTime changedAt = now();
        for (int index = 0; index < request.orderedIds().size(); index++) {
            byId.get(request.orderedIds().get(index)).changeDisplayOrder(index + 1, changedAt);
        }
        siteRepository.flush();
        return new ExternalLinkOrderResponse(request.orderedIds().stream().map(byId::get).map(AdminExternalLinkResponse::from).toList());
    }

    // 대상 존재 확인과 재인증 후 외부 링크 삭제
    @Transactional(noRollbackFor = ApiException.class)
    public void delete(Long linkId, AccountPrincipal currentAdmin, UUID challengeId, String code) {
        ExternalLink link = requireLink(linkId);
        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.EXTERNAL_LINK_DELETE,
                AdminActionTarget.EXTERNAL_LINK,
                linkId.toString()
        );
        siteRepository.deleteExternalLink(link);
        normalizeLinks();
    }

    private ExternalLink requireLink(Long linkId) {
        return siteRepository.findExternalLink(linkId)
                .orElseThrow(() -> new ApiException(ErrorCode.EXTERNAL_LINK_NOT_FOUND));
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

    private void normalizeLinks() {
        List<ExternalLink> links = siteRepository.findExternalLinksForUpdate();
        OffsetDateTime changedAt = now();
        for (int index = 0; index < links.size(); index++) {
            links.get(index).changeDisplayOrder(index + 1, changedAt);
        }
        siteRepository.flush();
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }
}
