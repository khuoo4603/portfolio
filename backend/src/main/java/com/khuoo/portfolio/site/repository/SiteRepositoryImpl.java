package com.khuoo.portfolio.site.repository;

import com.khuoo.portfolio.common.util.PortfolioEnums.PortfolioContentCode;
import com.khuoo.portfolio.site.domain.ExternalLink;
import com.khuoo.portfolio.site.domain.PortfolioContent;
import com.khuoo.portfolio.site.domain.PortfolioTechnology;
import com.khuoo.portfolio.site.domain.ProfileEntry;
import com.khuoo.portfolio.site.domain.Technology;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

// JPA 기반 Site 콘텐츠 단건 저장·변경 구현
@Repository
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SiteRepositoryImpl implements SiteRepository {

    private final EntityManager entityManager;

    // 요청 코드 전체의 기존 고정 Slot 조회
    @Override
    public List<PortfolioContent> findContents(Collection<PortfolioContentCode> contentCodes) {
        if (contentCodes.isEmpty()) {
            return List.of();
        }
        return entityManager.createQuery("""
                        SELECT content
                        FROM PortfolioContent content
                        WHERE content.contentCode IN :contentCodes
                        ORDER BY content.id ASC
                        """, PortfolioContent.class)
                .setParameter("contentCodes", contentCodes)
                .getResultList();
    }

    // 프로필 식별자 조회
    @Override
    public Optional<ProfileEntry> findProfileEntry(Long entryId) {
        return Optional.ofNullable(entityManager.find(ProfileEntry.class, entryId));
    }

    // 신규 프로필 항목 저장과 DB 생성시각 재조회
    @Override
    @Transactional
    public ProfileEntry saveProfileEntry(ProfileEntry entry) {
        entityManager.persist(entry);
        entityManager.flush();
        entityManager.refresh(entry);
        return entry;
    }

    // 프로필 항목 삭제
    @Override
    @Transactional
    public void deleteProfileEntry(ProfileEntry entry) {
        entityManager.remove(entry);
    }

    // 기술 식별자 조회
    @Override
    public Optional<Technology> findTechnology(Long technologyId) {
        return Optional.ofNullable(entityManager.find(Technology.class, technologyId));
    }

    // 기술 식별자 목록 조회
    @Override
    public List<Technology> findTechnologies(Collection<Long> technologyIds) {
        if (technologyIds.isEmpty()) {
            return List.of();
        }
        return entityManager.createQuery("""
                        SELECT technology
                        FROM Technology technology
                        WHERE technology.id IN :technologyIds
                        ORDER BY technology.id ASC
                        """, Technology.class)
                .setParameter("technologyIds", technologyIds)
                .getResultList();
    }

    // 제외 식별자 이외 동일 기술명 존재 여부 조회
    @Override
    public boolean existsTechnologyName(String name, Long excludedId) {
        if (excludedId == null) {
            return entityManager.createQuery("""
                            SELECT COUNT(technology)
                            FROM Technology technology
                            WHERE technology.name = :name
                            """, Long.class)
                    .setParameter("name", name)
                    .getSingleResult() > 0;
        }
        return entityManager.createQuery("""
                        SELECT COUNT(technology)
                        FROM Technology technology
                        WHERE technology.name = :name
                          AND technology.id <> :excludedId
                        """, Long.class)
                .setParameter("name", name)
                .setParameter("excludedId", excludedId)
                .getSingleResult() > 0;
    }

    // 신규 기술 사전 항목 저장과 DB 생성시각 재조회
    @Override
    @Transactional
    public Technology saveTechnology(Technology technology) {
        entityManager.persist(technology);
        entityManager.flush();
        entityManager.refresh(technology);
        return technology;
    }

    // 기술 사전 항목 삭제
    @Override
    @Transactional
    public void deleteTechnology(Technology technology) {
        entityManager.remove(technology);
    }

    // 기존 Mapping 삭제 후 새 메인 기술 구성 저장
    @Override
    @Transactional
    public void replacePortfolioTechnologies(List<PortfolioTechnology> mappings) {
        entityManager.createQuery("DELETE FROM PortfolioTechnology").executeUpdate();
        mappings.forEach(entityManager::persist);
        entityManager.flush();
    }

    // 외부 링크 식별자 조회
    @Override
    public Optional<ExternalLink> findExternalLink(Long linkId) {
        return Optional.ofNullable(entityManager.find(ExternalLink.class, linkId));
    }

    // 신규 외부 링크 저장과 DB 생성시각 재조회
    @Override
    @Transactional
    public ExternalLink saveExternalLink(ExternalLink link) {
        entityManager.persist(link);
        entityManager.flush();
        entityManager.refresh(link);
        return link;
    }

    // 외부 링크 삭제
    @Override
    @Transactional
    public void deleteExternalLink(ExternalLink link) {
        entityManager.remove(link);
    }

    // 현재 Transaction 변경 SQL 즉시 반영
    @Override
    @Transactional
    public void flush() {
        entityManager.flush();
    }
}
