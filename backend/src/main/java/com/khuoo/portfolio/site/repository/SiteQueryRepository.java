package com.khuoo.portfolio.site.repository;

import com.khuoo.portfolio.site.domain.ExternalLink;
import com.khuoo.portfolio.site.domain.PortfolioContent;
import com.khuoo.portfolio.site.domain.ProfileEntry;
import com.khuoo.portfolio.site.domain.ResumeFile;
import com.khuoo.portfolio.site.domain.Technology;
import com.khuoo.portfolio.site.domain.PortfolioTechnology;

import java.util.List;
import java.util.Optional;

// 공개 메인 페이지의 목록·조합 조회 경계
public interface SiteQueryRepository {

    // 고정 콘텐츠 전체 조회
    List<PortfolioContent> findPortfolioContents();

    // 공개 상태 프로필 항목 조회
    List<ProfileEntry> findEnabledProfileEntries();

    // 공개 메인 기술 관계와 활성 기술 사전 조회
    List<PortfolioTechnologyView> findPortfolioTechnologies();

    // 공개 상태 외부 링크 조회
    List<ExternalLink> findEnabledExternalLinks();

    // 현재 이력서 메타데이터 조회
    Optional<ResumeFile> findCurrentResume();

    // 비활성 포함 전체 프로필 항목 조회
    List<ProfileEntry> findProfileEntries();

    // 비활성 포함 전체 기술 사전 조회
    List<Technology> findTechnologyMaster();

    // 현재 메인 기술 구성 Mapping 조회
    List<PortfolioTechnology> findPortfolioTechnologyMappings();

    // 비활성 포함 전체 외부 링크 조회
    List<ExternalLink> findExternalLinks();
}
