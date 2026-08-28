import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { ProjectDetailModel } from "@/features/portfolio/project-detail";
import type { PublicViewModel } from "@/features/portfolio/public-portfolio";
import { PortfolioFooter, SiteHeader } from "../../portfolio-chrome";
import EngineeringList from "../kyvc/engineering-list";
import ProjectArchitecture from "../kyvc/project-architecture";
import ProjectMediaCarousel from "../kyvc/project-media-carousel";
import ProjectRail from "../kyvc/project-rail";
import styles from "../kyvc/kyvc-detail.module.css";

type ProjectDetailViewProps = {
  project: ProjectDetailModel;
  portfolio: PublicViewModel;
};

function projectNavigation(content: PublicViewModel["content"]) {
  return [
    [content.NAV_ABOUT, "/#about"],
    [content.NAV_TECH, "/#tech"],
    [content.NAV_PROJECTS, "/#projects"],
    [content.NAV_EDUCATION, "/#education"],
  ].flatMap(([label, href]) => label ? [{ label, href }] : []);
}

function technologyIconId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// 실제 Public Portfolio Data 기반 Project Detail 공통 Chrome
function ProjectChrome({
  portfolio,
  children,
}: {
  portfolio: PublicViewModel;
  children: ReactNode;
}) {
  const { content } = portfolio;
  return (
    <div className={`portfolio-shell ${styles.detailShell}`}>
      <SiteHeader
        detail
        mark={content.SITE_MARK ?? ""}
        markLabel={content.NAME ? `${content.NAME} 포트폴리오 Home` : "포트폴리오 Home"}
        navigation={projectNavigation(content)}
      />
      {children}
      <PortfolioFooter
        content={content}
        externalLinks={portfolio.externalLinks}
        resume={portfolio.resume}
      />
    </div>
  );
}

// Backend 장애와 404를 분리하는 Project Detail 안전 오류 상태
export function ProjectErrorView({
  portfolio,
  traceId,
}: {
  portfolio: PublicViewModel | null;
  traceId?: string;
}) {
  const error = (
    <main className="content-container" role="alert">
      <p>프로젝트 정보를 불러오지 못했습니다.</p>
      {traceId ? <p className="type-small">오류 추적 ID: {traceId}</p> : null}
    </main>
  );

  return portfolio ? <ProjectChrome portfolio={portfolio}>{error}</ProjectChrome> : error;
}

// 공개 Project Detail API ViewModel 기반 기존 KYvC Editorial Composition
export default function ProjectDetailView({ project, portfolio }: ProjectDetailViewProps) {
  const { content } = project;

  return (
    <ProjectChrome portfolio={portfolio}>
      <main>
        <section className={styles.projectHero} aria-labelledby="project-title">
          <div className={`content-container ${styles.heroInner}`}>
            <Link className={`${styles.backLink} type-small`} href="/#projects">
              <span aria-hidden="true">←</span> {portfolio.content.NAV_PROJECTS}
            </Link>

            <div className={styles.heroContent}>
              <p className={`${styles.heroLabel} type-small`}>PROJECT / {project.year}</p>
              <h1 className={`${styles.projectTitle} type-display-lg`} id="project-title">
                {project.name}
              </h1>
              <p className={`${styles.projectSummary} type-title`}>{project.summaryText || "-"}</p>

              <dl className={styles.heroMetadata}>
                <div className={styles.heroMetadataItem}>
                  <dt className="type-small">역할</dt>
                  <dd className="type-body">{project.detailRole || <span className={styles.emptyValue}>-</span>}</dd>
                </div>
                <div className={styles.heroMetadataItem}>
                  <dt className="type-small">개발 기간</dt>
                  <dd>
                    <span className="type-body">{project.period?.text || "-"}</span>
                    {project.period?.duration ? (
                      <span className="type-small">/ {project.period.duration}</span>
                    ) : null}
                  </dd>
                </div>
                <div className={styles.heroMetadataItem}>
                  <dt className="type-small">참여 인원</dt>
                  <dd className="type-body">
                    {project.teamSize && project.teamSize > 0
                      ? `${project.teamSize}명`
                      : <span className={styles.emptyValue}>-</span>}
                  </dd>
                </div>
              </dl>
            </div>

            <ProjectMediaCarousel media={project.media} projectName={project.name} />
          </div>
        </section>

        <div className={`content-container ${styles.detailLayout}`}>
          <ProjectRail sections={project.sections} />

          <div className={styles.detailContent}>
            <section
              className={`${styles.detailSection} ${styles.stackResultSection}`}
              id="detail-stack-result"
              aria-labelledby="stack-result-title"
            >
              <header className={styles.sectionHeader}>
                <h2 className={`${styles.sectionTitle} type-heading`} id="stack-result-title">
                  기술 스택 · 성과
                </h2>
              </header>

              <div className={styles.stackResultGrid}>
                <section className={styles.stackArea} aria-labelledby="stack-title">
                  <div className={styles.stackHeading}>
                    <h3 className="type-title" id="stack-title">기술 스택</h3>
                    {project.technologies.some((technology) => technology.highlighted) ? (
                      <p className={styles.stackLegend}><strong>- 본인 개발 영역</strong></p>
                    ) : null}
                  </div>
                  {project.technologies.length > 0 ? (
                    <ul className={styles.stackList} aria-label={`${project.name} 전체 기술 스택`}>
                      {project.technologies.map((technology) => (
                        <li
                          className={styles.stackItem}
                          data-icon={technologyIconId(technology.name)}
                          data-mine={technology.highlighted ? "true" : "false"}
                          key={technology.id}
                        >
                          <div className={styles.stackBlock} data-stack-block>
                            {technology.iconUrl ? (
                              <Image
                                alt=""
                                className={styles.stackIcon}
                                src={technology.iconUrl}
                                width={20}
                                height={20}
                                unoptimized
                              />
                            ) : null}
                            <span className={styles.stackName}>{technology.name}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : <p className={`${styles.emptyValue} type-body`}>-</p>}
                </section>

                <section className={styles.resultArea} aria-labelledby="result-title">
                  <h3 className="type-title" id="result-title">성과</h3>
                  {content.results.length > 0 ? (
                    <ol className={styles.resultList}>
                      {content.results.map((result, index) => (
                        <li className={styles.resultItem} key={`${index}-${result.title}`}>
                          <span className={`${styles.resultNumber} type-small`} aria-hidden="true">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <strong className={`${styles.resultTitle} type-title`}>{result.title}</strong>
                        </li>
                      ))}
                    </ol>
                  ) : <p className={`${styles.emptyValue} type-body`}>-</p>}
                </section>
              </div>
            </section>

            <section
              className={`${styles.detailSection} ${styles.backgroundFeaturesSection}`}
              id="detail-background"
              aria-labelledby="background-features-title"
            >
              <header className={styles.sectionHeader}>
                <h2 className={`${styles.sectionTitle} type-heading`} id="background-features-title">
                  문제 배경 · 주요 기능
                </h2>
              </header>

              <div className={styles.backgroundFeaturesGrid}>
                <article className={styles.backgroundArea} aria-labelledby="background-title">
                  <h3 className="type-title" id="background-title">문제 배경</h3>
                  {content.background.length > 0 ? (
                    <div className={styles.backgroundCopy}>
                      {content.background.map((paragraph, index) => (
                        <p className="type-body" key={`${index}-${paragraph}`}>{paragraph}</p>
                      ))}
                    </div>
                  ) : <p className={`${styles.emptyValue} type-body`}>-</p>}
                </article>

                <section className={styles.featuresArea} aria-labelledby="features-title">
                  <h3 className="type-title" id="features-title">주요 기능</h3>
                  {content.features.length > 0 ? (
                    <ol className={styles.featureList} aria-labelledby="features-title">
                      {content.features.map((feature, index) => (
                        <li className={styles.featureItem} key={`${index}-${feature.title}`}>
                          <span className={`${styles.featureNumber} type-small`}>
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <h4 className={`${styles.featureTitle} type-title`}>{feature.title}</h4>
                        </li>
                      ))}
                    </ol>
                  ) : <p className={`${styles.emptyValue} type-body`}>-</p>}
                </section>
              </div>
            </section>

            <section
              className={`${styles.detailSection} ${styles.developmentSection}`}
              id="detail-development"
              aria-labelledby="development-title"
            >
              <header className={styles.sectionHeader}>
                <h2 className={`${styles.sectionTitle} type-heading`} id="development-title">
                  직접 담당한 개발 영역
                </h2>
              </header>

              {content.development.length > 0 ? (
                <ol className={styles.developmentList}>
                  {content.development.map((area, index) => (
                    <li className={styles.developmentItem} key={`${index}-${area.title}`}>
                      <span className={`${styles.developmentNode} type-small`} aria-hidden="true">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <h3 className={`${styles.developmentTitle} type-title`}>{area.title}</h3>
                      {area.items.length > 0 ? (
                        <ul className={styles.developmentTasks}>
                          {area.items.map((item, itemIndex) => (
                            <li className="type-body" key={`${itemIndex}-${item}`}>{item}</li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ol>
              ) : <p className={`${styles.emptyValue} type-body`}>-</p>}
            </section>

            <section
              className={`${styles.detailSection} ${styles.architectureSection}`}
              id="detail-architecture"
              aria-labelledby="architecture-title"
            >
              <header className={styles.sectionHeader}>
                <h2 className={`${styles.sectionTitle} type-heading`} id="architecture-title">
                  아키텍처
                </h2>
              </header>

              <ProjectArchitecture
                slug={project.slug}
                projectName={project.name}
                architecture={content.architecture}
              />
            </section>

            <section
              className={`${styles.detailSection} ${styles.engineeringSection}`}
              id="detail-engineering"
              aria-labelledby="engineering-title"
            >
              <header className={styles.sectionHeader}>
                <h2 className={`${styles.sectionTitle} type-heading`} id="engineering-title">
                  기술적 문제 해결
                </h2>
              </header>

              {content.engineering.length > 0
                ? <EngineeringList items={content.engineering} />
                : <p className={`${styles.emptyValue} type-body`}>-</p>}
            </section>
          </div>
        </div>
      </main>
    </ProjectChrome>
  );
}
