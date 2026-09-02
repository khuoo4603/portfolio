import type { ReactNode } from "react";
import type { ProjectDetailModel } from "@/features/portfolio/project-detail";
import { PUBLIC_COPY, type PublicViewModel } from "@/features/portfolio/public-portfolio";
import { PortfolioFooter, SiteHeader } from "../../portfolio-chrome";
import styles from "../kyvc/kyvc-detail.module.css";
import ProjectDetailContent from "./project-detail-content";

type ProjectDetailViewProps = {
  project: ProjectDetailModel;
  portfolio: PublicViewModel;
};

function projectNavigation() {
  return [
    { label: PUBLIC_COPY.navigation.about, href: "/#about" },
    { label: PUBLIC_COPY.navigation.technology, href: "/#tech" },
    { label: PUBLIC_COPY.navigation.projects, href: "/#projects" },
    { label: PUBLIC_COPY.navigation.education, href: "/#education" },
  ];
}

// 실제 Public Portfolio Data 기반 Project Detail 공통 Chrome
function ProjectChrome({ portfolio, children }: { portfolio: PublicViewModel; children: ReactNode }) {
  const { content } = portfolio;
  return (
    <div className={`portfolio-shell ${styles.detailShell}`}>
      <SiteHeader
        detail
        mark={PUBLIC_COPY.siteMark}
        markLabel={content.NAME ? `${content.NAME} 포트폴리오 Home` : "포트폴리오 Home"}
        navigation={projectNavigation()}
      />
      {children}
      <PortfolioFooter content={content} externalLinks={portfolio.externalLinks} resume={portfolio.resume} />
    </div>
  );
}

// Backend 장애와 404를 분리하는 Project Detail 안전 오류 상태
export function ProjectErrorView({ portfolio, traceId }: { portfolio: PublicViewModel | null; traceId?: string }) {
  const error = (
    <main className="content-container" role="alert">
      <p>프로젝트 정보를 불러오지 못했습니다.</p>
      {traceId ? <p className="type-small">오류 추적 ID: {traceId}</p> : null}
    </main>
  );
  return portfolio ? <ProjectChrome portfolio={portfolio}>{error}</ProjectChrome> : error;
}

// 공개 Chrome 안에서 공용 Project Detail 렌더러 구성
export default function ProjectDetailView({ project, portfolio }: ProjectDetailViewProps) {
  return (
    <ProjectChrome portfolio={portfolio}>
      <main><ProjectDetailContent project={project} showBackLink /></main>
    </ProjectChrome>
  );
}
