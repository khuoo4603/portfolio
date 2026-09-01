import Image from "next/image";
import { Fragment } from "react";
import BorderGlow from "../components/ui/border-glow";
import {
  PUBLIC_COPY,
  type ContentMap,
  type ProfileGroups,
  type PublicViewModel,
  type TechnologyGroup,
} from "@/features/portfolio/public-portfolio";
import HeroNetworkBackground from "./hero-network-background";
import HeroSystemCard from "./hero-system-card";
import { PortfolioFooter, SiteHeader } from "./portfolio-chrome";
import ProjectsSection from "./projects-section";


function lines(value: string, accentIndex?: number) {
  return value.split(/\r?\n/).map((line, index, items) => (
    <Fragment key={`${index}-${line}`}>
      {index === accentIndex ? <span>{line}</span> : line}
      {index < items.length - 1 ? <br /> : null}
    </Fragment>
  ));
}

// Hero의 Identity와 Server Topology, 다음 Section Cue 구성
function Hero({ content }: { content: ContentMap }) {
  const englishName = content.ENGLISH_NAME?.split(/\s+/).filter(Boolean) ?? [];
  const firstNameLine = englishName[0];
  const secondNameLine = englishName.slice(1).join(" ");

  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-identity">
          <div className="hero-intro type-title">
            {content.POSITION ? <span>{content.POSITION}</span> : null}
          </div>

          <div className="hero-name-block">
            {content.NAME || firstNameLine ? (
              <h1 className="hero-name type-display-xl" id="hero-title">
                {content.NAME ? <span className="sr-only">{content.NAME}</span> : null}
                {firstNameLine ? <span aria-hidden="true">{firstNameLine}</span> : null}
                {secondNameLine ? (
                  <span className="hero-name-second" aria-hidden="true">{secondNameLine}</span>
                ) : null}
              </h1>
            ) : null}
          </div>

          <div className="hero-copy">
            {content.HERO_STATEMENT ? (
              <p className="hero-statement type-title">{lines(content.HERO_STATEMENT)}</p>
            ) : null}
            {content.HERO_DESCRIPTION ? (
              <p className="hero-description type-title">{lines(content.HERO_DESCRIPTION)}</p>
            ) : null}
          </div>

          <a className="section-cue type-body" href="#about">{PUBLIC_COPY.heroCue}</a>
        </div>

        <div className="hero-system">
          <HeroSystemCard />
        </div>
      </div>
    </section>
  );
}

// 자기소개와 개발 철학 중심 About 편집형 구성
function AboutSection({ content }: { content: ContentMap }) {
  const developmentValues = [
    ["DEVELOPMENT_VALUE_1_TITLE", "DEVELOPMENT_VALUE_1_DESCRIPTION"],
    ["DEVELOPMENT_VALUE_2_TITLE", "DEVELOPMENT_VALUE_2_DESCRIPTION"],
    ["DEVELOPMENT_VALUE_3_TITLE", "DEVELOPMENT_VALUE_3_DESCRIPTION"],
  ] as const;
  const visibleValues = developmentValues.flatMap(([titleCode, descriptionCode]) => {
    const title = content[titleCode];
    const description = content[descriptionCode];
    return title && description ? [{ title, description }] : [];
  });

  return (
    <section
      className="main-section about-section"
      aria-labelledby="about-title"
    >
      <span id="about" className="about-anchor" aria-hidden="true" />
      <div className="about-transition-window">
        <div className="about-viewport">
          <div className="content-container about-inner about-primary">
            <div className="about-heading">
              <p className="section-meta type-small">{PUBLIC_COPY.about.label}</p>
              <h2 className="section-title type-heading" id="about-title">{PUBLIC_COPY.about.title}</h2>
              {content.ABOUT_STATEMENT ? (
                <p className="about-statement type-statement">{lines(content.ABOUT_STATEMENT, 1)}</p>
              ) : null}
            </div>

            <figure className="profile-portrait">
              <Image
                alt={content.NAME ? `${content.NAME} 프로필 사진` : "프로필 사진"}
                className="profile-image"
                src="/images/profile/kim-hyunwoo-profile.webp"
                width={1086}
                height={1448}
                sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) 38vw, 360px"
              />
            </figure>

            <div className="about-introduction type-body-lg">
              {content.POSITION ? <p className="about-position type-title">{content.POSITION}</p> : null}
              {content.ABOUT_DESCRIPTION_1 ? <p>{content.ABOUT_DESCRIPTION_1}</p> : null}
              {content.ABOUT_DESCRIPTION_2 ? <p>{content.ABOUT_DESCRIPTION_2}</p> : null}
            </div>

            {visibleValues.length > 0 ? (
              <div
                className="about-values"
                aria-labelledby="values-title"
              >
                <h3 className="type-title" id="values-title">{PUBLIC_COPY.about.valuesTitle}</h3>
                <ol className="value-list">
                  {visibleValues.map((item) => (
                    <li className="value-item" data-value-card key={item.title}>
                      <BorderGlow className="value-card">
                        <div className="value-card-content">
                          <strong className="type-title">{item.title}</strong>
                          <p className="type-body">{item.description}</p>
                        </div>
                      </BorderGlow>
                    </li>
                  ))}
                </ol>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

// 핵심 기술을 설명형 카드 대신 정제된 Index 행으로 구성
function TechStackSection({ groups }: { groups: TechnologyGroup[] }) {
  return (
    <section
      className="main-section tech-section"
      id="tech"
      aria-labelledby="tech-title"
    >
      <div className="content-container tech-inner">
        <header className="tech-heading">
          <p className="section-meta type-small">{PUBLIC_COPY.technology.label}</p>
          <h2 className="section-title type-heading" id="tech-title">{PUBLIC_COPY.technology.title}</h2>
        </header>

        <ol className="tech-list">
          {groups.map((group) => (
            <li className="tech-row" key={group.category}>
              <span className="tech-category type-small">{group.label}</span>
              <ul className="tech-items" aria-label={`${group.label} 기술`}>
                {group.technologies.map((technology) => (
                  <li
                    className="tech-item type-body"
                    data-icon={technology.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
                    key={technology.id}
                  >
                    {technology.iconUrl ? (
                      <Image
                        alt=""
                        className="tech-icon"
                        src={technology.iconUrl}
                        width={24}
                        height={24}
                        unoptimized
                      />
                    ) : null}
                    <span>{technology.name}</span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// 학력과 주요 활동, 수상 성과 구성
function EducationSection({ groups }: { groups: ProfileGroups }) {
  const hasGroups = groups.education.length > 0 || groups.activity.length > 0 || groups.award.length > 0;
  if (!hasGroups) {
    return null;
  }

  return (
    <section
      className="main-section education-section"
      id="education"
      aria-labelledby="education-title"
    >
      <div className="content-container education-inner">
        <header className="education-heading">
          <p className="section-meta type-small">{PUBLIC_COPY.education.label}</p>
          <h2 className="section-title type-heading" id="education-title">{PUBLIC_COPY.education.title}</h2>
        </header>

        <div className="education-groups">
          {groups.education.length > 0 ? (
            <section className="education-group education-info-group" aria-labelledby="education-group-title">
              <h3 className="type-title" id="education-group-title">{PUBLIC_COPY.education.educationGroup}</h3>
              <ol className="education-list education-info-list">
                {groups.education.map((item) => (
                  <li className="education-row education-info-row" key={item.id}>
                    {item.period ? <span className="education-period education-info-period type-small">{item.period}</span> : null}
                    <strong className="education-info-title type-title">{item.title}</strong>
                    {item.detail ? <span className="education-program education-info-detail type-small">{item.detail}</span> : null}
                    {item.outcome ? <span className="education-status education-info-outcome type-small">{item.outcome}</span> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {groups.activity.length > 0 ? (
            <section className="activities-group education-info-group" aria-labelledby="activities-title">
              <h3 className="type-title" id="activities-title">{PUBLIC_COPY.education.activityGroup}</h3>
              <ol className="activities-list education-info-list">
                {groups.activity.map((activity) => (
                  <li className="activity-row education-info-row" key={activity.id}>
                    {activity.period ? <span className="activity-period education-info-period type-small">{activity.period}</span> : null}
                    <strong className="education-info-title type-title">{activity.title}</strong>
                    {activity.detail ? <span className="activity-description education-info-detail type-small">{activity.detail}</span> : null}
                    {activity.outcome ? <span className="education-info-outcome type-small">{activity.outcome}</span> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {groups.award.length > 0 ? (
            <section className="awards-group education-info-group" aria-labelledby="awards-title">
              <h3 className="type-title" id="awards-title">{PUBLIC_COPY.education.awardGroup}</h3>
              <ol className="awards-list education-info-list">
                {groups.award.map((award) => (
                  <li className="award-row education-info-row" key={award.id}>
                    {award.period ? <span className="award-year education-info-period type-small">{award.period}</span> : null}
                    <strong className="education-info-title type-title">{award.title}</strong>
                    {award.detail ? <span className="award-project education-info-detail type-small">{award.detail}</span> : null}
                    {award.outcome ? <span className="award-result education-info-outcome type-small">{award.outcome}</span> : null}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}
        </div>
      </div>
    </section>
  );
}

// 실제 Public ViewModel 기반 기존 Main Composition
export function HomeView({ model }: { model: PublicViewModel }) {
  const { content } = model;
  const navigation = [
    { label: PUBLIC_COPY.navigation.about, href: "#about" },
    { label: PUBLIC_COPY.navigation.technology, href: "#tech" },
    { label: PUBLIC_COPY.navigation.projects, href: "#projects" },
    { label: PUBLIC_COPY.navigation.education, href: "#education" },
  ];

  return (
    <div className="portfolio-shell">
      <SiteHeader
        mark={PUBLIC_COPY.siteMark}
        markLabel={content.NAME ? `${content.NAME} 포트폴리오 Home` : "포트폴리오 Home"}
        navigation={navigation}
      />

      <main>
        <div className="hero-about-flow">
          <div className="hero-shared-visual" aria-hidden="true">
            <div className="hero-grid" />
            <HeroNetworkBackground />
          </div>
          <Hero content={content} />
          <AboutSection content={content} />
        </div>
        <TechStackSection groups={model.technologies} />
        <ProjectsSection
          projects={model.projects}
          sectionLabel={PUBLIC_COPY.projects.label}
          sectionTitle={PUBLIC_COPY.projects.title}
          detailLabel={PUBLIC_COPY.projects.detail}
        />
        <EducationSection groups={model.profiles} />
      </main>

      <PortfolioFooter content={content} externalLinks={model.externalLinks} resume={model.resume} />
    </div>
  );
}
