"use client";

import Image from "next/image";
import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import BorderGlow from "../components/ui/border-glow";
import HeroNetworkBackground from "./hero-network-background";
import HeroSystemCard, { DEVELOPMENT_VALUES } from "./hero-system-card";

type PortfolioTheme = "light" | "dark";

const THEME_TRANSITION_DURATION = 520;
const THEME_TRANSITION_EASING = "cubic-bezier(0.22, 1, 0.36, 1)";

// Theme 전환 Origin과 Viewport 전체를 덮는 반경 계산
export function calculateThemeReveal(
  rect: Pick<DOMRect, "left" | "top" | "width" | "height">,
  viewportWidth: number,
  viewportHeight: number,
) {
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;
  const horizontalDistance = Math.max(x, viewportWidth - x);
  const verticalDistance = Math.max(y, viewportHeight - y);

  return {
    x,
    y,
    radius: Math.hypot(horizontalDistance, verticalDistance),
  };
}

// Theme DOM 반영과 사용자 선택값 저장
function applyTheme(theme: PortfolioTheme) {
  document.documentElement.dataset.theme = theme;

  try {
    window.localStorage.setItem("portfolio-theme", theme);
  } catch {
    // Browser 저장소 제한 환경의 Theme 전환 유지
  }
}

const navigationItems = [
  { label: "홈", href: "#home" },
  { label: "소개", href: "#about" },
  { label: "기술스택", href: "#tech" },
  { label: "프로젝트", href: "#projects" },
  { label: "학력 및 성과", href: "#education" },
];

const technologyGroups = [
  {
    category: "Language",
    technologies: [
      { name: "Java", id: "java", iconSrc: "/icons/tech/java.svg" },
      { name: "SQL", id: "sql", iconSrc: "/icons/tech/sql.svg" },
    ],
  },
  {
    category: "Backend",
    technologies: [
      { name: "Spring Boot", id: "spring-boot", iconSrc: "/icons/tech/spring-boot.svg" },
      { name: "PostgreSQL", id: "postgresql", iconSrc: "/icons/tech/postgresql.svg" },
      { name: "MySQL", id: "mysql", iconSrc: "/icons/tech/mysql.svg" },
    ],
  },
  {
    category: "Infrastructure",
    technologies: [
      { name: "Docker", id: "docker", iconSrc: "/icons/tech/docker.svg" },
      { name: "Linux", id: "linux", iconSrc: "/icons/tech/linux.svg" },
      { name: "Kubernetes", id: "kubernetes", iconSrc: "/icons/tech/kubernetes.svg" },
    ],
  },
  {
    category: "DevOps",
    technologies: [
      { name: "GitHub Actions", id: "github-actions", iconSrc: "/icons/tech/github-actions.svg" },
      { name: "GHCR", id: "ghcr", iconSrc: "/icons/tech/ghcr.svg" },
      { name: "Git", id: "git", iconSrc: "/icons/tech/git.svg" },
    ],
  },
] as const;

const projects = [
  {
    id: "kyvc",
    name: "KYvC",
    year: 2026,
    href: "/projects/kyvc",
    external: false,
    tagline: "법인 KYC 자동 심사 서비스",
    description: "법인 서류를 기반으로 KYC 심사를 자동화하고 검증 결과를 전자 증명 형태로 연결하는 서비스",
    role: "백엔드 · 인프라",
    technologies: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
    imageSrc: "/images/profile/project-intro-kyvc.png",
    imageAlt: "KYvC 프로젝트 대표 화면",
    imageWidth: 2557,
    imageHeight: 1264,
  },
  {
    id: "shkutrack",
    name: "SHKUTrack",
    year: 2026,
    href: "/projects/shkutrack",
    external: false,
    tagline: "성공회대학교 졸업 관리 서비스",
    description: "졸업요건 확인과 졸업 자료, 마이크로전공, 수강 전략을 하나의 흐름으로 관리하는 서비스",
    role: "풀스택 · 인프라",
    technologies: ["Java", "Spring Boot", "PostgreSQL", "Docker", "Kubernetes", "Nginx"],
    imageSrc: "/images/profile/project-intro-skhutrack.png",
    imageAlt: "SHKUTrack 프로젝트 대표 화면",
    imageWidth: 2539,
    imageHeight: 1265,
  },
  {
    id: "shkuload",
    name: "SHKULoad",
    year: 2023,
    href: "https://github.com/woohyuk0428/SKHU_Contest",
    external: true,
    tagline: "길찾기·중간지점·지하철 정보 서비스",
    description: "목적지 길찾기와 여러 위치의 중간지점 계산, 지하철 위치·지연정보를 제공하는 서비스",
    role: "백엔드",
    technologies: ["JavaScript", "Node.js", "Express", "EJS"],
    imageSrc: null,
    imageAlt: null,
    imageWidth: null,
    imageHeight: null,
  },
] as const;

const educationItems = [
  {
    institution: "성공회대학교",
    program: "소프트웨어융합전공",
    period: "2023.03 — 현재",
    status: "재학",
  },
  {
    institution: "경기경영고등학교",
    program: "스마트콘텐츠과",
    period: "2020.03 — 2023.02",
    status: "졸업",
  },
] as const;

const activities = [
  {
    period: "2026.04 — 현재",
    name: "QED",
    description: "성공회대학교 보안동아리",
  },
  {
    period: "2023.03 — 2023.12",
    name: "One Think IT's",
    description: "특성화고 졸업자 네트워크",
  },
] as const;

const awards = [
  { year: "2026", name: "성공회대학교 소프트웨어경진대회", project: "SKHUTRack", result: "1등" },
  { year: "2026", name: "KFIP 2026", project: "KYvC", result: "Toss 특별상" },
  { year: "2023", name: "성공회대학교 IT경진대회", project: "SKHURoad", result: "3등" },
  { year: "2021", name: "현대오토에버 특성화 고교생 화이트해커 양성교육", project: "-", result: "수료/입상" },
  { year: "2021", name: "SW·AI 교육 수기 공모전", project: "-", result: "최우수상 · 과학기술정보통신부 장관상" },
  { year: "2021", name: "Hello New() World", project: "NewLife", result: "대상" },
] as const;

// Hero의 Identity와 Server Topology, 다음 Section Cue 구성
function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-identity">
          <div className="hero-intro type-title">
            <span>BACKEND / INFRA DEVELOPER</span>
          </div>

          <div className="hero-name-block">
            <h1 className="hero-name type-display-xl" id="hero-title">
              <span className="sr-only">김현우</span>
              <span aria-hidden="true">KIM</span>
              <span className="hero-name-second" aria-hidden="true">
                HYUNWOO
              </span>
            </h1>
          </div>

          <div className="hero-copy">
            <p className="hero-statement type-title">
              Backend 개발부터
              <br />
              배포 / 운영까지 고려
            </p>
            <p className="hero-description type-title">
              문제에 맞는 기술 선택
              <br />
              서비스 설계 · 구현 · 실제 운영
            </p>
          </div>

          <a className="section-cue type-body" href="#about">
            소개로 이동 ↘
          </a>
        </div>

        <div className="hero-system">
          <HeroSystemCard />
        </div>
      </div>
    </section>
  );
}

// 자기소개와 개발 철학 중심 About 편집형 구성
function AboutSection() {
  return (
    <section className="main-section about-section" id="about" aria-labelledby="about-title">
      <div className="about-transition-window">
        <div className="about-viewport">
          <div className="content-container about-inner about-primary">
            <div className="about-heading">
              <p className="section-meta type-small">ABOUT</p>
              <h2 className="section-title type-heading" id="about-title">소개</h2>
              <p className="about-statement type-statement">
                많은 기술보다
                <br />
                <span>문제에 맞는</span>
                <br />
                기술 선택
              </p>
            </div>

            <figure className="profile-portrait">
              <Image
                alt="김현우 프로필 사진"
                className="profile-image"
                src="/images/profile/kim-hyunwoo-profile.png"
                width={1086}
                height={1448}
                sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) 38vw, 360px"
              />
            </figure>

            <div className="about-introduction type-body-lg">
              <p className="about-position type-title">BACKEND / INFRA DEVELOPER</p>
              <p>성공회대학교에 재학 중인 김현우입니다. 경기경영고등학교 스마트콘텐츠과에서 웹과 게임 개발을 접한 뒤, 대회·동아리·외부 교육을 통해 개발 경험을 넓혀왔습니다.</p>
              <p>현재는 Spring Boot 기반 Backend 개발을 중심으로 Database 설계, Docker·Linux 실행 환경, CI/CD와 배포·운영까지 하나의 서비스 흐름으로 다룹니다. 새로운 기술의 수보다 문제와 서비스 규모에 맞는 구조를 선택하고, 실제로 운영 가능한 상태까지 완성하는 것을 중요하게 생각합니다.</p>
            </div>

            <div className="about-values" aria-labelledby="values-title">
              <h3 className="type-title" id="values-title">개발 철학</h3>
              <ol className="value-list">
                {DEVELOPMENT_VALUES.map((value) => (
                  <li className="value-item" data-value-card key={value.title}>
                    <BorderGlow className="value-card">
                      <div className="value-card-content">
                        <strong className="type-title">{value.title}</strong>
                        <p className="type-body">{value.description}</p>
                      </div>
                    </BorderGlow>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// 핵심 기술을 설명형 카드 대신 정제된 Index 행으로 구성
function TechStackSection() {
  return (
    <section className="main-section tech-section" id="tech" aria-labelledby="tech-title">
      <div className="content-container tech-inner">
        <header className="tech-heading">
          <p className="section-meta type-small">TECH STACK</p>
          <h2 className="section-title type-heading" id="tech-title">기술 스택</h2>
        </header>

        <ol className="tech-list">
          {technologyGroups.map((group) => (
            <li className="tech-row" key={group.category}>
              <span className="tech-category type-small">{group.category}</span>
              <ul className="tech-items" aria-label={`${group.category} 기술`}>
                {group.technologies.map((technology) => (
                  <li className="tech-item type-body" data-icon={technology.id} key={technology.name}>
                    <Image
                      alt=""
                      className="tech-icon"
                      src={technology.iconSrc}
                      width={24}
                      height={24}
                      unoptimized
                    />
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

// 연도별 Project History와 Scroll Timeline을 연결한 Projects 구성
function ProjectsSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const projectHistoryRef = useRef<HTMLOListElement>(null);
  const projectRowRefs = useRef<Array<HTMLElement | null>>([]);
  const projectNodeRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const [activeProject, setActiveProject] = useState<(typeof projects)[number]["id"]>(projects[0].id);

  useEffect(() => {
    let frameId: number | null = null;

    // Viewport 중심 기준 Timeline 활성 상태와 Beam 진행도 동기화
    const updateTimeline = () => {
      const section = sectionRef.current;
      const history = projectHistoryRef.current;
      const rows = projectRowRefs.current.filter((row): row is HTMLElement => row !== null);
      const nodes = projectNodeRefs.current.filter((node): node is HTMLSpanElement => node !== null);

      if (!section || !history || rows.length === 0) {
        return;
      }

      const viewportCenter = window.innerHeight / 2;
      const rowCenters = rows.map((row) => {
        const rect = row.getBoundingClientRect();

        return rect.top + rect.height / 2;
      });
      let nearestIndex = 0;

      rowCenters.forEach((center, index) => {
        if (Math.abs(center - viewportCenter) < Math.abs(rowCenters[nearestIndex] - viewportCenter)) {
          nearestIndex = index;
        }
      });

      const firstCenter = rowCenters[0];
      const lastCenter = rowCenters[rowCenters.length - 1];
      const centerDistance = lastCenter - firstCenter;
      const progress = centerDistance === 0
        ? 0
        : Math.min(1, Math.max(0, (viewportCenter - firstCenter) / centerDistance));

      section.style.setProperty("--project-timeline-progress", String(progress));
      setActiveProject(projects[nearestIndex].id);

      if (nodes.length === rows.length && nodes.every((node) => node.getBoundingClientRect().width > 0)) {
        const historyRect = history.getBoundingClientRect();
        const nodeCenters = nodes.map((node) => {
          const rect = node.getBoundingClientRect();

          return {
            x: rect.left - historyRect.left + rect.width / 2,
            y: rect.top - historyRect.top + rect.height / 2,
          };
        });
        const firstNode = nodeCenters[0];
        const lastNode = nodeCenters[nodeCenters.length - 1];

        history.style.setProperty("--project-timeline-left", `${firstNode.x}px`);
        history.style.setProperty("--project-timeline-top", `${firstNode.y}px`);
        history.style.setProperty("--project-timeline-height", `${Math.max(0, lastNode.y - firstNode.y)}px`);
      }
    };

    const scheduleTimelineUpdate = () => {
      if (frameId !== null) {
        return;
      }

      if (typeof window.requestAnimationFrame !== "function") {
        updateTimeline();
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = null;
        updateTimeline();
      });
    };

    window.addEventListener("scroll", scheduleTimelineUpdate, { passive: true });
    window.addEventListener("resize", scheduleTimelineUpdate);
    scheduleTimelineUpdate();

    return () => {
      window.removeEventListener("scroll", scheduleTimelineUpdate);
      window.removeEventListener("resize", scheduleTimelineUpdate);

      if (frameId !== null && typeof window.cancelAnimationFrame === "function") {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  // Hover 항목 순서 기준 Timeline Beam 진행도 임시 적용
  const setHoveredTimelineProgress = (index: number) => {
    const lastIndex = projects.length - 1;
    const progress = lastIndex === 0 ? 1 : index / lastIndex;

    projectHistoryRef.current?.style.setProperty("--project-timeline-progress", String(progress));
  };

  // Hover 종료 시 Scroll 기준 Timeline Beam 진행도 복원
  const restoreTimelineProgress = () => {
    projectHistoryRef.current?.style.removeProperty("--project-timeline-progress");
  };

  return (
    <section
      className="main-section projects-section"
      id="projects"
      aria-labelledby="projects-title"
      ref={sectionRef}
    >
      <div className="content-container projects-inner">
        <header className="projects-heading">
          <p className="section-meta type-small">PROJECTS</p>
          <h2 className="section-title type-heading" id="projects-title">프로젝트</h2>
        </header>

        <div className="project-stage">
          <ol
            className="project-showcases"
            aria-label="연도별 프로젝트"
            ref={projectHistoryRef}
            onMouseLeave={restoreTimelineProgress}
          >
            {projects.map((project, index) => {
              const isActive = activeProject === project.id;
              const showsYear = index === 0 || projects[index - 1].year !== project.year;

              return (
                <li
                  className="project-history-row"
                  key={project.id}
                  onMouseEnter={() => setHoveredTimelineProgress(index)}
                >
                  <div className={`project-timeline-entry${showsYear ? " has-year" : ""}`}>
                    <span className="project-year type-small">{showsYear ? project.year : null}</span>
                    <span
                      className={`project-node${isActive ? " is-active" : ""}`}
                      aria-hidden="true"
                      ref={(node) => {
                        projectNodeRefs.current[index] = node;
                      }}
                    />
                    <a
                      aria-current={isActive ? "location" : undefined}
                      className={`project-tab${isActive ? " is-active" : ""}`}
                      href={`#project-${project.id}`}
                    >
                      <span className="project-tab-name type-body" id={`project-label-${project.id}`}>
                        {project.name}
                      </span>
                    </a>
                  </div>

                  <article
                    className="project-panel"
                    id={`project-${project.id}`}
                    aria-labelledby={`project-label-${project.id}`}
                    ref={(row) => {
                      projectRowRefs.current[index] = row;
                    }}
                  >
                    {project.href && project.imageSrc && project.imageAlt && project.imageWidth && project.imageHeight ? (
                      <a
                        className="project-thumbnail"
                        href={project.href}
                        aria-label={`${project.name} 프로젝트 상세 보기`}
                      >
                        <Image
                          alt={project.imageAlt}
                          className="project-thumbnail-image"
                          src={project.imageSrc}
                          width={project.imageWidth}
                          height={project.imageHeight}
                          sizes="(max-width: 767px) calc(100vw - 40px), (max-width: 1023px) 20vw, 260px"
                        />
                      </a>
                    ) : (
                      <div className="project-thumbnail project-thumbnail-placeholder" aria-hidden="true" />
                    )}

                    <div className="project-information">
                      <div className="project-information-group">
                        <div className="project-information-content">
                          <p className="project-tagline type-title">{project.tagline}</p>
                          <p className="project-description type-body">{project.description}</p>
                          <div className="project-meta type-small">
                            <span className="project-meta-badge project-role-badge">{project.role}</span>
                            <span className="project-meta-badge project-tech-badge">
                              {project.technologies.map((technology, technologyIndex) => (
                                <span className="project-tech-item" key={technology}>
                                  {technologyIndex > 0 ? (
                                    <span className="project-tech-separator" aria-hidden="true">
                                      {"\u00A0·\u00A0"}
                                    </span>
                                  ) : null}
                                  <span>{technology}</span>
                                </span>
                              ))}
                            </span>
                          </div>
                        </div>
                        {project.href ? (
                          <a
                            className="project-detail-link type-body"
                            href={project.href}
                            aria-label={`${project.name} 자세히 보기`}
                            target={project.external ? "_blank" : undefined}
                            rel={project.external ? "noopener noreferrer" : undefined}
                          >
                            자세히 보기 <span aria-hidden="true">↗</span>
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </article>
                </li>
              );
            })}
          </ol>
        </div>
      </div>
    </section>
  );
}

// 학력과 주요 활동, 수상 성과 구성
function EducationSection() {
  return (
    <section className="main-section education-section" id="education" aria-labelledby="education-title">
      <div className="content-container education-inner">
        <header className="education-heading">
          <p className="section-meta type-small">EDUCATION &amp; ACHIEVEMENTS</p>
          <h2 className="section-title type-heading" id="education-title">학력 및 성과</h2>
        </header>

        <div className="education-groups">
          <section className="education-group education-info-group" aria-labelledby="education-group-title">
            <h3 className="type-title" id="education-group-title">학력</h3>
            <ol className="education-list education-info-list">
              {educationItems.map((item) => (
                <li className="education-row education-info-row" key={item.institution}>
                  <span className="education-period education-info-period type-small">{item.period}</span>
                  <strong className="education-info-title type-title">{item.institution}</strong>
                  <span className="education-program education-info-detail type-small">{item.program}</span>
                  <span className="education-status education-info-outcome type-small">{item.status}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="activities-group education-info-group" aria-labelledby="activities-title">
            <h3 className="type-title" id="activities-title">주요 활동</h3>
            <ol className="activities-list education-info-list">
              {activities.map((activity) => (
                <li className="activity-row education-info-row" key={`${activity.period}-${activity.name}`}>
                  <span className="activity-period education-info-period type-small">{activity.period}</span>
                  <strong className="education-info-title type-title">{activity.name}</strong>
                  <span className="activity-description education-info-detail type-small">{activity.description}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="awards-group education-info-group" aria-labelledby="awards-title">
            <h3 className="type-title" id="awards-title">수상</h3>
            <ol className="awards-list education-info-list">
              {awards.map((award) => (
                <li className="award-row education-info-row" key={`${award.year}-${award.name}`}>
                  <span className="award-year education-info-period type-small">{award.year}</span>
                  <strong className="education-info-title type-title">{award.name}</strong>
                  <span className="award-project education-info-detail type-small">{award.project}</span>
                  <span className="award-result education-info-outcome type-small">{award.result}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}

// Footer Identity와 실제 Contact 중심의 페이지 Footer 구성
function PortfolioFooter() {
  return (
    <footer className="portfolio-footer" id="footer">
      <div className="content-container footer-inner">
        <div className="footer-identity">
          <h2 className="footer-name type-heading">김현우</h2>
          <p className="footer-role type-small">BACKEND / INFRA DEVELOPER</p>
        </div>

        <div className="footer-information">
          <div className="footer-info-group">
            <p className="type-small">RESUME</p>
            <div className="footer-disabled-actions">
              <span className="type-body-lg" aria-disabled="true">이력서 보기</span>
              <span className="type-body-lg" aria-disabled="true">PDF 다운로드</span>
            </div>
          </div>

          <div className="footer-info-group footer-contact">
            <p className="type-small">CONTACT</p>
            <div className="footer-contact-links">
              <a href="mailto:khuoo4603@gmail.com" aria-label="khuoo4603@gmail.com">
                <Mail aria-hidden="true" strokeWidth={1.75} />
              </a>
              <a href="https://www.instagram.com/hyun_woooooooooo/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
                <Instagram aria-hidden="true" strokeWidth={1.75} />
              </a>
              <a href="https://github.com/khuoo4603" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                <Github aria-hidden="true" strokeWidth={1.75} />
              </a>
              <a href="https://www.linkedin.com/in/%ED%98%84%EC%9A%B0-%EA%B9%80-b0201a414/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                <Linkedin aria-hidden="true" strokeWidth={1.75} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom type-small">
          <span>PORTFOLIO / 2026</span>
          <span>© 2026 Kim Hyunwoo. All rights reserved.</span>
        </div>
      </div>
    </footer>
  );
}

// 포트폴리오 Main 전체 Composition과 Theme 제어
export default function Home() {
  const themeToggleRef = useRef<HTMLButtonElement>(null);
  const themeTransitionRunningRef = useRef(false);

  // 현재 Theme 반전과 Circle Reveal 전환 제어
  const handleThemeToggle = async () => {
    if (themeTransitionRunningRef.current) {
      return;
    }

    const root = document.documentElement;
    const nextTheme: PortfolioTheme = root.dataset.theme === "dark" ? "light" : "dark";
    const button = themeToggleRef.current;
    const isReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (
      typeof document.startViewTransition !== "function" ||
      isReducedMotion ||
      !button ||
      typeof root.animate !== "function"
    ) {
      applyTheme(nextTheme);
      return;
    }

    const { x, y, radius } = calculateThemeReveal(
      button.getBoundingClientRect(),
      window.innerWidth,
      window.innerHeight,
    );
    let themeApplied = false;

    themeTransitionRunningRef.current = true;

    try {
      const transition = document.startViewTransition(() => {
        applyTheme(nextTheme);
        themeApplied = true;
      });
      const transitionFinished = transition.finished.catch(() => undefined);

      await transition.ready;

      const animation = root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${radius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: THEME_TRANSITION_DURATION,
          easing: THEME_TRANSITION_EASING,
          fill: "both",
          pseudoElement: "::view-transition-new(root)",
        },
      );

      await Promise.all([transitionFinished, animation.finished]);
    } catch {
      if (!themeApplied) {
        applyTheme(nextTheme);
      }
    } finally {
      themeTransitionRunningRef.current = false;
    }
  };

  return (
    <div className="portfolio-shell">
      <header className="site-header">
        <div className="content-container header-inner">
          <a className="site-mark type-small" href="#home" aria-label="김현우 포트폴리오 Home">
            <span>KIM HYUNWOO</span>
          </a>

          <nav className="primary-navigation" aria-label="포트폴리오 주요 영역">
            {navigationItems.map((item) => (
              <a className="navigation-link type-small" href={item.href} key={item.href}>
                {item.label}
              </a>
            ))}
          </nav>

          <button
            ref={themeToggleRef}
            className="theme-toggle"
            type="button"
            onClick={handleThemeToggle}
            aria-label="색상 테마 전환"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24">
              <circle className="theme-toggle-orbit" cx="12" cy="12" r="7.5" />
              <path className="theme-toggle-half" d="M12 4.5a7.5 7.5 0 0 1 0 15Z" />
              <path className="theme-toggle-axis" d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3" />
            </svg>
          </button>
        </div>
      </header>

      <main>
        <div className="hero-about-flow">
          <div className="hero-shared-visual" aria-hidden="true">
            <div className="hero-grid" />
            <HeroNetworkBackground />
          </div>
          <Hero />
          <AboutSection />
        </div>
        <TechStackSection />
        <ProjectsSection />
        <EducationSection />
      </main>

      <PortfolioFooter />
    </div>
  );
}
