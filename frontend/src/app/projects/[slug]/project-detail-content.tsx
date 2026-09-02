import Image from "next/image";
import Link from "next/link";
import type { ProjectDetailModel } from "@/features/portfolio/project-detail";
import { PUBLIC_COPY } from "@/features/portfolio/public-portfolio";
import EngineeringList from "../kyvc/engineering-list";
import ProjectArchitecture from "../kyvc/project-architecture";
import ProjectMediaCarousel from "../kyvc/project-media-carousel";
import ProjectRail from "../kyvc/project-rail";
import styles from "../kyvc/kyvc-detail.module.css";

function technologyIconId(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Public과 Admin Draft Preview가 공유하는 Project Detail 핵심 렌더러
export default function ProjectDetailContent({
  project,
  showBackLink = false,
}: {
  project: ProjectDetailModel;
  showBackLink?: boolean;
}) {
  const { content } = project;
  const sectionIds = new Set(project.sections.map((section) => section.id));

  return (
    <div className={styles.projectDetailCore}>
      <section className={styles.projectHero} aria-labelledby="project-title">
        <div className={`content-container ${styles.heroInner}`}>
          {showBackLink ? (
            <Link className={`${styles.backLink} type-small`} href="/#projects">
              <span aria-hidden="true">←</span> {PUBLIC_COPY.navigation.projects}
            </Link>
          ) : null}

          <div className={styles.heroContent}>
            <p className={`${styles.heroLabel} type-small`}>PROJECT / {project.year ?? "-"}</p>
            <h1 className={`${styles.projectTitle} type-display-lg`} id="project-title">
              {project.name || "-"}
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
                  {project.period?.duration ? <span className="type-small">/ {project.period.duration}</span> : null}
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

          <ProjectMediaCarousel media={project.media} projectName={project.name || "Project"} />
        </div>
      </section>

      <div className={`content-container ${styles.detailLayout}`}>
        <ProjectRail sections={project.sections} />

        <div className={styles.detailContent}>
          {sectionIds.has("detail-stack-result") ? (
            <section className={`${styles.detailSection} ${styles.stackResultSection}`} id="detail-stack-result" aria-labelledby="stack-result-title">
              <header className={styles.sectionHeader}>
                <h2 className={`${styles.sectionTitle} type-heading`} id="stack-result-title">기술 스택 · 성과</h2>
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
                        <li className={styles.stackItem} data-icon={technologyIconId(technology.name)} data-mine={technology.highlighted ? "true" : "false"} key={technology.id}>
                          <div className={styles.stackBlock} data-stack-block>
                            {technology.iconUrl ? <Image alt="" className={styles.stackIcon} src={technology.iconUrl} width={20} height={20} unoptimized /> : null}
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
                          <span className={`${styles.resultNumber} type-small`} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                          <div className={styles.resultCopy}>
                            <strong className={`${styles.resultTitle} type-title`}>{result.title}</strong>
                            {result.description ? <p className={`${styles.resultDescription} type-body`}>{result.description}</p> : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : <p className={`${styles.emptyValue} type-body`}>-</p>}
                </section>
              </div>
            </section>
          ) : null}

          {sectionIds.has("detail-background") ? (
            <section className={`${styles.detailSection} ${styles.backgroundFeaturesSection}`} id="detail-background" aria-labelledby="background-features-title">
              <header className={styles.sectionHeader}>
                <h2 className={`${styles.sectionTitle} type-heading`} id="background-features-title">문제 배경 · 주요 기능</h2>
              </header>
              <div className={styles.backgroundFeaturesGrid}>
                <article className={styles.backgroundArea} aria-labelledby="background-title">
                  <h3 className="type-title" id="background-title">문제 배경</h3>
                  {content.background.length > 0 ? (
                    <div className={styles.backgroundCopy}>
                      {content.background.map((item, index) => (
                        <article className={styles.backgroundItem} key={`${index}-${item.body}`}>
                          {item.title ? <h4 className="type-title">{item.title}</h4> : null}
                          <p className="type-body">{item.body}</p>
                        </article>
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
                          <span className={`${styles.featureNumber} type-small`}>{String(index + 1).padStart(2, "0")}</span>
                          <div className={styles.featureCopy}>
                            <h4 className={`${styles.featureTitle} type-title`}>{feature.title}</h4>
                            {feature.description ? <p className={`${styles.featureDescription} type-body`}>{feature.description}</p> : null}
                          </div>
                        </li>
                      ))}
                    </ol>
                  ) : <p className={`${styles.emptyValue} type-body`}>-</p>}
                </section>
              </div>
            </section>
          ) : null}

          {sectionIds.has("detail-development") ? (
            <section className={`${styles.detailSection} ${styles.developmentSection}`} id="detail-development" aria-labelledby="development-title">
              <header className={styles.sectionHeader}>
                <h2 className={`${styles.sectionTitle} type-heading`} id="development-title">직접 담당한 개발 영역</h2>
              </header>
              {content.development.length > 0 ? (
                <ol className={styles.developmentList}>
                  {content.development.map((area, index) => (
                    <li className={styles.developmentItem} key={`${index}-${area.title}`}>
                      <span className={`${styles.developmentNode} type-small`} aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
                      <h3 className={`${styles.developmentTitle} type-title`}>{area.title}</h3>
                      <div className={styles.developmentContent}>
                        {area.items.length > 0 ? <ul className={styles.developmentTasks}>{area.items.map((item, itemIndex) => <li className="type-body" key={`${itemIndex}-${item}`}>{item}</li>)}</ul> : null}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : <p className={`${styles.emptyValue} type-body`}>-</p>}
            </section>
          ) : null}

          {sectionIds.has("detail-architecture") ? (
            <section className={`${styles.detailSection} ${styles.architectureSection}`} id="detail-architecture" aria-labelledby="architecture-title">
              <header className={styles.sectionHeader}>
                <h2 className={`${styles.sectionTitle} type-heading`} id="architecture-title">아키텍처</h2>
              </header>
              <ProjectArchitecture projectName={project.name || "Project"} architectureImageUrl={project.architectureImageUrl} architecture={content.architecture} />
            </section>
          ) : null}

          {sectionIds.has("detail-engineering") ? (
            <section className={`${styles.detailSection} ${styles.engineeringSection}`} id="detail-engineering" aria-labelledby="engineering-title">
              <header className={styles.sectionHeader}>
                <h2 className={`${styles.sectionTitle} type-heading`} id="engineering-title">기술적 문제 해결</h2>
              </header>
              {content.engineering.length > 0 ? <EngineeringList items={content.engineering} /> : <p className={`${styles.emptyValue} type-body`}>-</p>}
            </section>
          ) : null}
        </div>
      </div>
    </div>
  );
}
