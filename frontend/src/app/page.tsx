import Image from "next/image";
import { Github, Instagram, Linkedin, Mail } from "lucide-react";
import BorderGlow from "../components/ui/border-glow";
import HeroNetworkBackground from "./hero-network-background";
import HeroSystemCard from "./hero-system-card";
import ProjectsSection from "./projects-section";
import ThemeToggle from "./theme-toggle";

const DEVELOPMENT_VALUES = [
  {
    title: "문서화의 가치",
    description:
      "구현 결과만 남기지 않습니다. 설계와 선택의 이유를 기록해 시간이 지나도 구조와 의도를 다시 이해할 수 있도록 합니다.",
  },
  {
    title: "덜어냄의 미학",
    description:
      "기술과 기능을 더하는 것보다 필요한 것만 남기는 것을 중요하게 생각합니다. 불필요한 복잡성을 줄이고 명확하고 유지보수 가능한 구조를 선택합니다.",
  },
  {
    title: "운영까지",
    description:
      "구현과 배포에서 끝내지 않습니다. 로그, 모니터링, 백업과 장애 대응까지 고려해 실제로 지속 운영할 수 있는 상태를 완성의 기준으로 봅니다.",
  },
] as const;

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
                src="/images/profile/kim-hyunwoo-profile.webp"
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

// 포트폴리오 Main의 Server 중심 전체 Composition
export default function Home() {
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

          <ThemeToggle />
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
