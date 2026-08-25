import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { PortfolioFooter, SiteHeader } from "../../portfolio-chrome";
import EngineeringList from "./engineering-list";
import { kyvcProject } from "./kyvc-data";
import ProjectArchitecture from "./project-architecture";
import ProjectMediaCarousel from "./project-media-carousel";
import ProjectRail from "./project-rail";
import styles from "./kyvc-detail.module.css";

export const metadata: Metadata = {
  title: "KYvC | 김현우 포트폴리오",
  description: kyvcProject.summary,
};

// KYvC 프로젝트 상세의 정적 콘텐츠와 기술 흐름 구성
export default function KyvcProjectPage() {
  return (
    <div className={`portfolio-shell ${styles.detailShell}`}>
      <SiteHeader detail />

      <main>
        <section className={styles.projectHero} aria-labelledby="project-title">
          <div className={`content-container ${styles.heroInner}`}>
            <Link className={`${styles.backLink} type-small`} href="/#projects">
              <span aria-hidden="true">←</span> 프로젝트 목록
            </Link>

            <div className={styles.heroContent}>
              <p className={`${styles.heroLabel} type-small`}>TEAM PROJECT</p>
              <h1 className={`${styles.projectTitle} type-display-lg`} id="project-title">
                {kyvcProject.title}
              </h1>
              <p className={`${styles.projectSummary} type-title`}>{kyvcProject.summary}</p>

              <dl className={styles.heroMetadata}>
                <div className={styles.heroMetadataItem}>
                  <dt className="type-small">역할</dt>
                  <dd className="type-body">{kyvcProject.role}</dd>
                </div>
                <div className={styles.heroMetadataItem}>
                  <dt className="type-small">개발 기간</dt>
                  <dd>
                    <span className="type-body">{kyvcProject.period}</span>
                    <span className="type-small">/ {kyvcProject.duration}</span>
                  </dd>
                </div>
                <div className={styles.heroMetadataItem}>
                  <dt className="type-small">참여 인원</dt>
                  <dd className="type-body">{kyvcProject.teamSize}</dd>
                </div>
              </dl>
            </div>

            <ProjectMediaCarousel media={kyvcProject.media} />
          </div>
        </section>

        <div className={`content-container ${styles.detailLayout}`}>
          <ProjectRail />

          <div className={styles.detailContent}>
            <section
              className={`${styles.detailSection} ${styles.stackResultSection}`}
              id="detail-stack-result"
              aria-labelledby="stack-result-title"
            >
              <header className={styles.sectionHeader}>
                <p className={`${styles.sectionMeta} type-small`}>기술 스택 · 성과</p>
                <h2 className={`${styles.sectionTitle} type-heading`} id="stack-result-title">
                  기술 스택과 성과
                </h2>
              </header>

              <div className={styles.stackResultGrid}>
                <section className={styles.stackArea} aria-labelledby="stack-title">
                  <div className={styles.stackHeading}>
                    <h3 className="type-title" id="stack-title">기술 스택</h3>
                    <p className={styles.stackLegend}>
                      <strong>- 본인 개발 영역</strong>
                    </p>
                  </div>
                  <ul className={styles.stackList} aria-label="KYvC 전체 기술 스택">
                    {kyvcProject.techStacks.map((technology) => (
                      <li
                        className={styles.stackItem}
                        data-icon={technology.iconId}
                        data-mine={technology.mine ? "true" : "false"}
                        key={technology.name}
                      >
                        <div className={styles.stackBlock} data-stack-block>
                          <Image
                            alt=""
                            className={styles.stackIcon}
                            src={technology.iconSrc}
                            width={20}
                            height={20}
                            unoptimized
                          />
                          <span className={styles.stackName}>{technology.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>

                <section className={styles.resultArea} aria-labelledby="result-title">
                  <h3 className="type-title" id="result-title">성과</h3>
                  <ol className={styles.resultList}>
                    {kyvcProject.results.map((result, index) => (
                      <li className={styles.resultItem} key={result.title}>
                        <span className={`${styles.resultNumber} type-display-lg`} aria-hidden="true">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <strong className={`${styles.resultTitle} type-title`}>{result.title}</strong>
                          {result.description ? (
                            <p className={`${styles.resultDescription} type-body`}>{result.description}</p>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </section>

            <section
              className={`${styles.detailSection} ${styles.backgroundFeaturesSection}`}
              id="detail-background"
              aria-labelledby="background-title"
            >
              <article className={styles.backgroundArea}>
                <header className={styles.sectionHeader}>
                  <p className={`${styles.sectionMeta} type-small`}>배경</p>
                  <h2 className={`${styles.sectionTitle} type-heading`} id="background-title">문제 배경</h2>
                </header>
                <div className={styles.backgroundCopy}>
                  {kyvcProject.background.map((paragraph) => (
                    <p className="type-body" key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </article>

              <div className={styles.featuresArea}>
                <header className={styles.sectionHeader} id="detail-features">
                  <p className={`${styles.sectionMeta} type-small`}>기능</p>
                  <h2 className={`${styles.sectionTitle} type-heading`} id="features-title">주요 기능</h2>
                </header>
                <ol className={styles.featureList} aria-labelledby="features-title">
                  {kyvcProject.features.map((feature, index) => (
                    <li className={styles.featureItem} key={feature.title}>
                      <span className={`${styles.featureNumber} type-small`}>
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <h3 className={`${styles.featureTitle} type-title`}>{feature.title}</h3>
                        <p className={`${styles.featureDescription} type-body`}>{feature.description}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </section>

            <section
              className={`${styles.detailSection} ${styles.developmentSection}`}
              id="detail-development"
              aria-labelledby="development-title"
            >
              <header className={styles.sectionHeader}>
                <p className={`${styles.sectionMeta} type-small`}>개발 영역</p>
                <h2 className={`${styles.sectionTitle} type-heading`} id="development-title">
                  직접 담당한 개발 영역
                </h2>
              </header>

              <ol className={styles.developmentList}>
                {kyvcProject.developmentAreas.map((area, index) => (
                  <li className={styles.developmentItem} key={area.title}>
                    <span className={`${styles.developmentNode} type-small`} aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h3 className={`${styles.developmentTitle} type-title`}>{area.title}</h3>
                    <ul className={styles.developmentTasks}>
                      {area.items.map((item) => (
                        <li className="type-body" key={item}>{item}</li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ol>
            </section>

            <section
              className={`${styles.detailSection} ${styles.architectureSection}`}
              id="detail-architecture"
              aria-labelledby="architecture-title"
            >
              <header className={styles.sectionHeader}>
                <p className={`${styles.sectionMeta} type-small`}>아키텍처</p>
                <h2 className={`${styles.sectionTitle} type-heading`} id="architecture-title">
                  서비스 구조와 배포 흐름
                </h2>
              </header>

              <ProjectArchitecture />

              <div className={styles.architectureSummary}>
                {kyvcProject.architecture.summary.map((paragraph) => (
                  <p className="type-body" key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </section>

            <section
              className={`${styles.detailSection} ${styles.engineeringSection}`}
              id="detail-engineering"
              aria-labelledby="engineering-title"
            >
              <header className={styles.sectionHeader}>
                <p className={`${styles.sectionMeta} type-small`}>기술적 문제 해결</p>
                <h2 className={`${styles.sectionTitle} type-heading`} id="engineering-title">
                  기술적 문제 해결
                </h2>
              </header>

              <EngineeringList items={kyvcProject.engineering} />
            </section>
          </div>
        </div>
      </main>

      <PortfolioFooter />
    </div>
  );
}
