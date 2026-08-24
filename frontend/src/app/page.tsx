"use client";

import Image from "next/image";
import { useRef } from "react";
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
  { label: "기술", href: "#tech" },
  { label: "프로젝트", href: "#projects" },
  { label: "이력", href: "#education" },
];

const technologyGroups = [
  {
    category: "Language",
    technologies: ["Java", "SQL"],
    description: "서비스 로직 구현과 관계형 데이터 처리의 기본 언어",
  },
  {
    category: "Backend",
    technologies: ["Spring Boot", "PostgreSQL", "MySQL"],
    description: "API와 비즈니스 로직, 데이터 모델을 중심으로 Backend 서비스 구성",
  },
  {
    category: "Infra",
    technologies: ["Docker", "Docker Compose", "Linux", "Kubernetes"],
    description: "Container 기반 실행 환경과 서비스 배포 구조 구성",
  },
  {
    category: "DevOps",
    technologies: ["GitHub Actions", "GHCR", "Git"],
    description: "Source 변경부터 Build, Image 생성과 배포까지 이어지는 개발 흐름 관리",
  },
];

const projects = [
  {
    id: "kyvc",
    name: "KYvC",
    href: "/projects/kyvc",
    tagline: "법인 KYC 자동 심사 서비스",
    description: "법인 서류를 기반으로 KYC 심사를 자동화하고 검증 결과를 전자 증명 형태로 연결하는 서비스",
    role: "Backend / Architecture / Infra",
    technologies: ["Java", "Spring Boot", "PostgreSQL", "Docker"],
  },
  {
    id: "shkutrack",
    name: "SHKUTrack",
    href: "/projects/shkutrack",
    tagline: "성공회대학교 졸업 관리 서비스",
    description: "졸업요건 확인과 졸업 자료, 마이크로전공, 수강 전략을 하나의 흐름으로 관리하는 서비스",
    role: "Development / Infra / Operation",
    technologies: ["Java", "Spring Boot", "PostgreSQL", "Docker", "Kubernetes", "Nginx"],
  },
] as const;

const educationItems = [
  {
    institution: "성공회대학교",
    program: null,
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
    period: "2023.03 — 2023.12",
    name: "One Think IT's",
    description: "특성화고 졸업자 네트워크",
  },
  {
    period: "2026.04 — 현재",
    name: "QED",
    description: "성공회대학교 보안동아리",
  },
] as const;

const awards = [
  { year: "2026", name: "성공회대학교 소프트웨어경진대회", result: "1등" },
  { year: "2026", name: "KFIP 2026", result: "Toss 특별상" },
  { year: "2023", name: "성공회대학교 IT경진대회", result: "3등" },
  { year: "2021", name: "현대오토에버 특성화 고교생 화이트해커 양성교육", result: "수료/입상" },
  { year: "2021", name: "신나는 SW·AI 교육 수기 공모전", result: "최우수상 · 과학기술정보통신부 장관상" },
  { year: "2021", name: "Hello New() World", result: "대상" },
] as const;

// 프로젝트별 실제 서비스 개념 중심 Technical Visual 구성
function ProjectVisual({ projectId }: { projectId: (typeof projects)[number]["id"] }) {
  if (projectId === "shkutrack") {
    return (
      <div className="project-visual project-visual-shkutrack" aria-hidden="true">
        <div className="shkutrack-wordmark">
          <span className="type-display-lg">SHKU</span>
          <span className="type-title">TRACK</span>
        </div>
        <svg className="shkutrack-structure" viewBox="0 0 640 420">
          <path d="M82 98H258V210H438V322H566" />
          <path d="M258 210V322H146" />
          <rect x="70" y="86" width="24" height="24" />
          <rect x="246" y="198" width="24" height="24" />
          <rect x="426" y="310" width="24" height="24" />
          <circle cx="146" cy="322" r="11" />
          <circle cx="566" cy="322" r="11" />
          <text x="70" y="72">COURSE</text>
          <text x="246" y="184">MAJOR</text>
          <text x="426" y="296">CREDIT</text>
          <text x="470" y="354">GRADUATION</text>
        </svg>
      </div>
    );
  }

  return (
    <div className="project-visual project-visual-kyvc" aria-hidden="true">
      <div className="kyvc-wordmark">
        <span className="type-display-xl">K</span>
        <span className="type-display-lg">YvC</span>
      </div>
      <svg className="kyvc-structure" viewBox="0 0 640 420">
        <path d="M76 90H264V210H476V330H570" />
        <path d="M154 330H264V210" />
        <rect x="64" y="78" width="24" height="24" />
        <rect x="252" y="198" width="24" height="24" />
        <rect x="464" y="318" width="24" height="24" />
        <circle cx="570" cy="330" r="11" />
        <circle cx="154" cy="330" r="11" />
      </svg>
    </div>
  );
}

// Hero의 Identity와 Server Topology, 다음 Section Cue 구성
function Hero() {
  return (
    <section className="hero" id="home" aria-labelledby="hero-title">
      <div className="hero-inner">
        <div className="hero-identity">
          <div className="hero-intro type-small">
            <span>BACKEND / INFRA</span>
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
              개발부터
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

// 자기소개와 개발 가치 중심 About 편집형 구성
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
              <p>성공회대학교에 재학 중인 Backend / Infra 개발자 김현우입니다. 경기경영고등학교 스마트콘텐츠과에서 웹과 게임 개발을 접하고, 대회와 동아리 활동, 외부 교육 등 다양한 경험을 하면서 개발을 시작했습니다.</p>
              <p>이후 대학과 군 복무 중에도 프로그래밍을 계속했고, 지금은 Spring Boot 기반 Backend 개발을 중심으로 Database 설계, Docker와 Linux 기반 실행 환경, CI/CD, 배포와 운영까지 하나의 서비스 흐름으로 다루는 데 관심을 두고 있습니다.</p>
              <p>새로운 기술을 많이 사용하는 것보다 현재 문제와 서비스 규모에 맞는 구조를 선택하는 것을 중요하게 생각합니다. 기능이 동작하는 데서 끝내지 않고 실제로 배포하고 운영할 수 있는 상태까지 완성하는 것을 목표로 개발합니다.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="content-container about-details">
        <div className="about-values" aria-labelledby="values-title">
          <h3 className="type-title" id="values-title">개발 가치</h3>
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
    </section>
  );
}

// 핵심 기술의 Category 기반 Index 구성
function TechStackSection() {
  return (
    <section className="main-section tech-section" id="tech" aria-labelledby="tech-title">
      <div className="content-container tech-inner">
        <header className="tech-heading">
          <p className="section-meta type-small">TECH STACK</p>
          <h2 className="section-title type-heading" id="tech-title">기술 스택</h2>
          <p className="type-body">Backend / Infra 개발자로서 핵심적으로 사용하는 기술</p>
        </header>

        <ol className="tech-list">
          {technologyGroups.map((group) => (
            <li className="tech-row" key={group.category}>
              <strong className="type-title">{group.category}</strong>
              <span className="tech-names type-body">
                {group.technologies.map((technology) => <span key={technology}>{technology}</span>)}
              </span>
              <p className="tech-description type-body">{group.description}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

// 두 프로젝트의 실제 정보를 연결한 Static Showcase 구성
function ProjectsSection() {
  return (
    <section className="main-section projects-section" id="projects" aria-labelledby="projects-title">
      <div className="projects-backdrop" aria-hidden="true" />
      <div className="content-container projects-inner">
        <header className="projects-heading">
          <p className="section-meta type-small">PROJECTS</p>
          <h2 className="section-title type-heading" id="projects-title">프로젝트</h2>
        </header>

        <div className="project-stage">
          <ol className="project-index" aria-label="프로젝트 목록">
            {projects.map((project, index) => (
              <li key={project.id}>
                <a className={`project-tab${index === 0 ? " is-active" : ""}`} href={`#project-${project.id}`}>
                  <span className="project-tab-name type-body-lg">{project.name}</span>
                  <span className="type-body">{project.tagline}</span>
                </a>
              </li>
            ))}
          </ol>

          <div className="project-showcases">
            {projects.map((project) => (
              <article className="project-panel" id={`project-${project.id}`} key={project.id}>
                <h3 className="sr-only">{project.name}</h3>
                <ProjectVisual projectId={project.id} />

                <div className="project-summary">
                  <div className="project-summary-copy">
                    <p className="project-tagline type-title">{project.tagline}</p>
                    <p className="type-body-lg">{project.description}</p>
                    <dl className="project-facts type-body">
                      <div>
                        <dt>ROLE</dt>
                        <dd>{project.role}</dd>
                      </div>
                      <div>
                        <dt>CORE</dt>
                        <dd>{project.technologies.join(" · ")}</dd>
                      </div>
                    </dl>
                  </div>

                  <a className="project-link type-body" href={project.href} aria-label={`${project.name} 프로젝트 보기`}>
                    프로젝트 보기
                    <span aria-hidden="true">↗</span>
                  </a>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// 학력과 주요 활동, 수상 이력 구성
function EducationSection() {
  return (
    <section className="main-section education-section" id="education" aria-labelledby="education-title">
      <div className="content-container education-inner">
        <header className="education-heading">
          <p className="section-meta type-small">EDUCATION &amp; ACHIEVEMENTS</p>
          <h2 className="section-title type-heading" id="education-title">학력과 주요 이력</h2>
        </header>

        <div className="education-groups">
          <section className="education-group" aria-labelledby="education-group-title">
            <h3 className="type-title" id="education-group-title">학력</h3>
            <ol className="education-list">
              {educationItems.map((item) => (
                <li className="education-row" key={item.institution}>
                  <span className="education-period type-body">{item.period}</span>
                  <strong className="type-title">{item.institution}</strong>
                  <span className="education-program type-body">{item.program ?? ""}</span>
                  <span className="education-status type-body">{item.status}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="activities-group" aria-labelledby="activities-title">
            <h3 className="type-title" id="activities-title">주요 활동</h3>
            <ol className="activities-list">
              {activities.map((activity) => (
                <li className="activity-row" key={`${activity.period}-${activity.name}`}>
                  <span className="activity-period type-body">{activity.period}</span>
                  <strong className="type-title">{activity.name}</strong>
                  <span className="activity-description type-body">{activity.description}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="awards-group" aria-labelledby="awards-title">
            <h3 className="type-title" id="awards-title">수상</h3>
            <ol className="awards-list">
              {awards.map((award) => (
                <li className="award-row" key={`${award.year}-${award.name}`}>
                  <span className="award-year type-body">{award.year}</span>
                  <strong className="type-title">{award.name}</strong>
                  <span className="award-result type-body">{award.result}</span>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </section>
  );
}

// Position과 실제 Contact 중심의 대형 Footer Ending 구성
function PortfolioFooter() {
  return (
    <footer className="portfolio-footer" id="footer">
      <div className="footer-rules" aria-hidden="true"><span /><span /><span /></div>
      <div className="content-container footer-inner">
        <div className="footer-closing">
          <h2 className="footer-position type-display-xl">
            <span>BACKEND /</span>
            <span className="footer-infrastructure">INFRA</span>
          </h2>
        </div>

        <div className="footer-information">
          <div className="footer-info-group">
            <p className="type-small">Resume</p>
            <div className="footer-disabled-actions">
              <span className="type-body-lg" aria-disabled="true">이력서 보기</span>
              <span className="type-body-lg" aria-disabled="true">PDF 다운로드</span>
            </div>
          </div>

          <div className="footer-info-group footer-contact">
            <p className="type-small">Contact</p>
            <div className="footer-contact-links type-body-lg">
              <a href="mailto:khuoo4603@gmail.com">khuoo4603@gmail.com</a>
              <a href="https://www.instagram.com/hyun_woooooooooo/" target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href="https://github.com/khuoo4603" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="https://www.linkedin.com/in/%ED%98%84%EC%9A%B0-%EA%B9%80-b0201a414/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
            </div>
          </div>
        </div>

        <div className="footer-bottom type-small">
          <span>KH / PORTFOLIO 2026</span>
          <span>© 2026 Kim Hyunwoo</span>
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
            <span>KH</span>
            <span>PORTFOLIO / 2026</span>
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
