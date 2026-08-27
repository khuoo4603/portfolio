package com.khuoo.portfolio.site.service;

import com.khuoo.portfolio.authentication.security.AccountPrincipal;
import com.khuoo.portfolio.authentication.service.AdminActionVerifier;
import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionOperation;
import com.khuoo.portfolio.common.util.PortfolioEnums.AdminActionTarget;
import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCategory;
import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCode;
import com.khuoo.portfolio.site.domain.PortfolioContent;
import com.khuoo.portfolio.site.domain.PortfolioTechnology;
import com.khuoo.portfolio.site.domain.Technology;
import com.khuoo.portfolio.site.dto.AdminExternalLinkResponse;
import com.khuoo.portfolio.site.dto.AdminPortfolioContentResponse;
import com.khuoo.portfolio.site.dto.AdminProfileEntryResponse;
import com.khuoo.portfolio.site.dto.AdminProjectSummaryResponse;
import com.khuoo.portfolio.site.dto.AdminSiteResponse;
import com.khuoo.portfolio.site.dto.PortfolioContentUpdateRequest;
import com.khuoo.portfolio.site.dto.PortfolioContentUpdateResponse;
import com.khuoo.portfolio.site.dto.PortfolioTechnologyMappingResponse;
import com.khuoo.portfolio.site.dto.PortfolioTechnologyReplaceRequest;
import com.khuoo.portfolio.site.dto.PortfolioTechnologyReplaceResponse;
import com.khuoo.portfolio.site.dto.ResumeMetadataResponse;
import com.khuoo.portfolio.site.dto.TechnologyMasterResponse;
import com.khuoo.portfolio.site.repository.SiteQueryRepository;
import com.khuoo.portfolio.site.repository.SiteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.util.Comparator;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

// 관리자 사이트 통합 조회와 고정·메인 구성 관리
@Service
@RequiredArgsConstructor
public class AdminSiteService {

    private static final ZoneId SERVICE_ZONE = ZoneId.of("Asia/Seoul");

    private final SiteQueryRepository siteQueryRepository;
    private final SiteRepository siteRepository;
    private final AdminActionVerifier adminActionVerifier;

    // 비활성 데이터를 포함한 관리자 사이트 초기 데이터 통합 조회
    public AdminSiteResponse findSite() {
        return new AdminSiteResponse(
                siteQueryRepository.findPortfolioContents().stream()
                        .map(AdminPortfolioContentResponse::from)
                        .toList(),
                siteQueryRepository.findProfileEntries().stream()
                        .map(AdminProfileEntryResponse::from)
                        .toList(),
                siteQueryRepository.findTechnologyMaster().stream()
                        .map(TechnologyMasterResponse::from)
                        .toList(),
                siteQueryRepository.findPortfolioTechnologyMappings().stream()
                        .map(PortfolioTechnologyMappingResponse::from)
                        .toList(),
                siteQueryRepository.findProjects().stream()
                        .map(AdminProjectSummaryResponse::from)
                        .toList(),
                siteQueryRepository.findExternalLinks().stream()
                        .map(AdminExternalLinkResponse::from)
                        .toList(),
                siteQueryRepository.findCurrentResume()
                        .map(ResumeMetadataResponse::from)
                        .orElse(null)
        );
    }

    // 고정 Slot 전체 검증과 재인증 후 콘텐츠 Batch 수정
    @Transactional(noRollbackFor = ApiException.class)
    public PortfolioContentUpdateResponse updateContents(
            PortfolioContentUpdateRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        Set<ContentKey> requestKeys = new LinkedHashSet<>();
        for (PortfolioContentUpdateRequest.Item item : request.items()) {
            if (item.contentCode().category() != item.category()
                    || !requestKeys.add(new ContentKey(item.category(), item.contentCode()))) {
                throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
            }
        }

        List<PortfolioContent> found = siteRepository.findContents(
                request.items().stream().map(PortfolioContentUpdateRequest.Item::contentCode).toList()
        );
        Map<ContentKey, PortfolioContent> contentByKey = found.stream()
                .collect(Collectors.toMap(
                        content -> new ContentKey(content.getCategory(), content.getContentCode()),
                        Function.identity()
                ));
        List<PortfolioContent> ordered = request.items().stream()
                .map(item -> requireContent(contentByKey, item))
                .toList();

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PORTFOLIO_CONTENT_UPDATE,
                AdminActionTarget.PORTFOLIO_CONTENT,
                null
        );

        OffsetDateTime changedAt = now();
        for (int index = 0; index < ordered.size(); index++) {
            ordered.get(index).changeValue(request.items().get(index).contentValue(), changedAt);
        }
        return new PortfolioContentUpdateResponse(
                ordered.stream().map(AdminPortfolioContentResponse::from).toList()
        );
    }

    // 활성 기술 전체 검증과 재인증 후 메인 기술 구성 전체 교체
    @Transactional(noRollbackFor = ApiException.class)
    public PortfolioTechnologyReplaceResponse replacePortfolioTechnologies(
            PortfolioTechnologyReplaceRequest request,
            AccountPrincipal currentAdmin,
            UUID challengeId,
            String code
    ) {
        Set<Long> technologyIds = new LinkedHashSet<>();
        for (PortfolioTechnologyReplaceRequest.Item item : request.items()) {
            if (!technologyIds.add(item.technologyId())) {
                throw new ApiException(ErrorCode.COMMON_VALIDATION_ERROR);
            }
        }

        Map<Long, Technology> technologyById = siteRepository.findTechnologies(technologyIds).stream()
                .collect(Collectors.toMap(Technology::getId, Function.identity()));
        for (Long technologyId : technologyIds) {
            Technology technology = technologyById.get(technologyId);
            if (technology == null || !technology.isEnabled()) {
                throw new ApiException(ErrorCode.TECHNOLOGY_NOT_FOUND);
            }
        }

        List<PortfolioTechnology> mappings = request.items().stream()
                .map(item -> PortfolioTechnology.create(item.technologyId(), item.displayOrder()))
                .sorted(Comparator.comparingInt(PortfolioTechnology::getDisplayOrder)
                        .thenComparing(PortfolioTechnology::getTechnologyId))
                .toList();

        adminActionVerifier.verifyAndConsume(
                currentAdmin,
                challengeId,
                code,
                AdminActionOperation.PORTFOLIO_TECHNOLOGY_UPDATE,
                AdminActionTarget.PORTFOLIO_TECHNOLOGY,
                null
        );
        siteRepository.replacePortfolioTechnologies(mappings);
        return new PortfolioTechnologyReplaceResponse(
                mappings.stream().map(PortfolioTechnologyMappingResponse::from).toList()
        );
    }

    private PortfolioContent requireContent(
            Map<ContentKey, PortfolioContent> contentByKey,
            PortfolioContentUpdateRequest.Item item
    ) {
        PortfolioContent content = contentByKey.get(new ContentKey(item.category(), item.contentCode()));
        if (content == null) {
            throw new ApiException(ErrorCode.SITE_CONTENT_NOT_FOUND);
        }
        return content;
    }

    private OffsetDateTime now() {
        return OffsetDateTime.now(SERVICE_ZONE);
    }

    // 고정 콘텐츠 복합 식별 기준
    private record ContentKey(
            PortfolioContentCategory category,
            PortfolioContentCode contentCode
    ) {
    }
}
