package com.khuoo.portfolio.site.service;

import com.khuoo.portfolio.common.error.ApiException;
import com.khuoo.portfolio.common.error.ErrorCode;
import com.khuoo.portfolio.project.domain.Project;
import com.khuoo.portfolio.site.dto.ExternalLinkResponse;
import com.khuoo.portfolio.site.dto.PortfolioContentResponse;
import com.khuoo.portfolio.site.dto.ProfileEntryResponse;
import com.khuoo.portfolio.project.dto.ProjectCardResponse;
import com.khuoo.portfolio.project.dto.ProjectContentResponse;
import com.khuoo.portfolio.project.dto.ProjectMediaResponse;
import com.khuoo.portfolio.project.dto.ProjectTechnologyResponse;
import com.khuoo.portfolio.site.dto.PublicPortfolioResponse;
import com.khuoo.portfolio.project.dto.PublicProjectResponse;
import com.khuoo.portfolio.site.dto.ResumeMetadataResponse;
import com.khuoo.portfolio.site.dto.TechnologyResponse;
import com.khuoo.portfolio.project.repository.ProjectQueryRepository;
import com.khuoo.portfolio.project.repository.ProjectTechnologyView;
import com.khuoo.portfolio.site.repository.SiteQueryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

// 공개 포트폴리오 메인과 프로젝트 상세 조회
@Service
@RequiredArgsConstructor
public class PublicSiteService {

    private final SiteQueryRepository siteQueryRepository;
    private final ProjectQueryRepository projectQueryRepository;
    private final ObjectMapper objectMapper;

    // 공개 메인 페이지 데이터의 책임별 조회와 응답 조합
    public PublicPortfolioResponse findPortfolio() {
        List<PortfolioContentResponse> contents = siteQueryRepository.findPortfolioContents().stream()
                .map(PortfolioContentResponse::from)
                .toList();
        List<ProfileEntryResponse> profileEntries = siteQueryRepository.findEnabledProfileEntries().stream()
                .map(ProfileEntryResponse::from)
                .toList();
        List<TechnologyResponse> portfolioTechnologies = siteQueryRepository.findPortfolioTechnologies().stream()
                .map(TechnologyResponse::from)
                .toList();
        List<Project> projects = projectQueryRepository.findEnabledProjects();
        List<Long> projectIds = projects.stream().map(Project::getId).toList();
        Map<Long, List<ProjectTechnologyView>> cardTechnologies = projectQueryRepository
                .findCardTechnologies(projectIds)
                .stream()
                .collect(Collectors.groupingBy(ProjectTechnologyView::projectId));
        List<ExternalLinkResponse> externalLinks = siteQueryRepository.findEnabledExternalLinks().stream()
                .map(ExternalLinkResponse::from)
                .toList();
        ResumeMetadataResponse resume = siteQueryRepository.findCurrentResume()
                .map(ResumeMetadataResponse::from)
                .orElse(null);

        return new PublicPortfolioResponse(
                contents,
                profileEntries,
                portfolioTechnologies,
                projects.stream()
                        .map(project -> ProjectCardResponse.from(
                                project,
                                cardTechnologies.getOrDefault(project.getId(), List.of()).stream()
                                        .map(TechnologyResponse::from)
                                        .toList()
                        ))
                        .toList(),
                externalLinks,
                resume
        );
    }

    // 공개 상태 프로젝트의 상세 구성요소 조회와 응답 조합
    public PublicProjectResponse findProject(String slug) {
        Project project = projectQueryRepository.findEnabledBySlug(slug)
                .orElseThrow(() -> new ApiException(ErrorCode.PROJECT_NOT_FOUND));

        List<ProjectTechnologyResponse> technologies = projectQueryRepository
                .findTechnologies(project.getId())
                .stream()
                .map(ProjectTechnologyResponse::from)
                .toList();
        ProjectContentResponse content = projectQueryRepository.findContent(project.getId())
                .map(value -> ProjectContentResponse.from(value, objectMapper))
                .orElseGet(ProjectContentResponse::empty);
        List<ProjectMediaResponse> media = projectQueryRepository.findMedia(project.getId())
                .stream()
                .map(ProjectMediaResponse::fromPublic)
                .toList();

        return PublicProjectResponse.from(project, technologies, content, media);
    }
}
