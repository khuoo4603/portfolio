package com.khuoo.portfolio.site.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCode;
import com.khuoo.portfolio.site.domain.ExternalLink;
import com.khuoo.portfolio.site.domain.PortfolioContent;
import com.khuoo.portfolio.site.domain.PortfolioTechnology;
import com.khuoo.portfolio.site.domain.ProfileEntry;
import com.khuoo.portfolio.site.domain.ResumeFile;
import com.khuoo.portfolio.site.domain.Technology;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

// Site 콘텐츠 단건 저장·변경 Repository 경계
public interface SiteRepository {

    // 콘텐츠 코드 목록의 기존 고정 Slot 조회
    List<PortfolioContent> findContents(Collection<PortfolioContentCode> contentCodes);

    // 프로필 식별자 조회
    Optional<ProfileEntry> findProfileEntry(Long entryId);

    // 신규 프로필 항목 저장
    ProfileEntry saveProfileEntry(ProfileEntry entry);

    // 프로필 항목 삭제
    void deleteProfileEntry(ProfileEntry entry);

    // 기술 식별자 조회
    Optional<Technology> findTechnology(Long technologyId);

    // 기술 식별자 목록 조회
    List<Technology> findTechnologies(Collection<Long> technologyIds);

    // 제외 식별자 이외 동일 기술명 존재 여부 조회
    boolean existsTechnologyName(String name, Long excludedId);

    // 신규 기술 사전 항목 저장
    Technology saveTechnology(Technology technology);

    // 기술 사전 항목 삭제
    void deleteTechnology(Technology technology);

    // 메인 기술 구성 전체 교체
    void replacePortfolioTechnologies(List<PortfolioTechnology> mappings);

    // 외부 링크 식별자 조회
    Optional<ExternalLink> findExternalLink(Long linkId);

    // 신규 외부 링크 저장
    ExternalLink saveExternalLink(ExternalLink link);

    // 외부 링크 삭제
    void deleteExternalLink(ExternalLink link);

    // 현재 이력서 Metadata 쓰기 잠금 조회
    Optional<ResumeFile> findResumeForUpdate();

    // 현재 이력서 Metadata 저장
    ResumeFile saveResume(ResumeFile resume);

    // 변경 SQL 즉시 반영
    void flush();
}
