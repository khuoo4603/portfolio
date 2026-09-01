import type {
  PortfolioContent,
  PortfolioContentCategory,
  PortfolioContentCode,
  PublicPortfolio,
  PublicTechnology,
} from "@/types/api";

function content(
  category: PortfolioContentCategory,
  contentCode: PortfolioContentCode,
  contentValue: string,
): PortfolioContent {
  return { category, contentCode, contentValue };
}

const technologies: PublicTechnology[] = [
  { id: 1, name: "Java", category: "LANGUAGE", iconUrl: "/icons/tech/java.svg", displayOrder: 1 },
  { id: 2, name: "SQL", category: "LANGUAGE", iconUrl: "/icons/tech/sql.svg", displayOrder: 2 },
  { id: 3, name: "Spring Boot", category: "BACKEND", iconUrl: "/icons/tech/spring-boot.svg", displayOrder: 3 },
  { id: 4, name: "PostgreSQL", category: "DATABASE", iconUrl: "/icons/tech/postgresql.svg", displayOrder: 4 },
  { id: 5, name: "MySQL", category: "DATABASE", iconUrl: "/icons/tech/mysql.svg", displayOrder: 5 },
  { id: 13, name: "React", category: "FRONTEND", iconUrl: "/icons/tech/react.svg", displayOrder: 6 },
  { id: 6, name: "Docker", category: "INFRA", iconUrl: "/icons/tech/docker.svg", displayOrder: 7 },
  { id: 7, name: "Docker Compose", category: "INFRA", iconUrl: "/icons/tech/docker.svg", displayOrder: 8 },
  { id: 8, name: "Linux", category: "INFRA", iconUrl: "/icons/tech/linux.svg", displayOrder: 9 },
  { id: 9, name: "Kubernetes", category: "INFRA", iconUrl: "/icons/tech/kubernetes.svg", displayOrder: 10 },
  { id: 10, name: "GitHub Actions", category: "DEVOPS", iconUrl: "/icons/tech/github-actions.svg", displayOrder: 11 },
  { id: 11, name: "GHCR", category: "DEVOPS", iconUrl: "/icons/tech/ghcr.svg", displayOrder: 12 },
  { id: 12, name: "Git", category: "DEVOPS", iconUrl: "/icons/tech/git.svg", displayOrder: 13 },
];

// LOCAL 관찰 개수와 독립된 Public 화면 Test Fixture
export const PUBLIC_PORTFOLIO_FIXTURE: PublicPortfolio = {
  portfolioContents: [
    content("COMMON", "NAME", "김현우"),
    content("COMMON", "ENGLISH_NAME", "KIM HYUNWOO"),
    content("COMMON", "POSITION", "BACKEND / INFRA DEVELOPER"),
    content("COMMON", "AFFILIATION", "성공회대학교 소프트웨어융합전공"),
    content("MAIN", "HERO_STATEMENT", "Backend 개발부터\n배포 / 운영까지 고려"),
    content("MAIN", "HERO_DESCRIPTION", "문제에 맞는 기술 선택\n서비스 설계 · 구현 · 실제 운영"),
    content("PROFILE", "ABOUT_STATEMENT", "많은 기술보다\n문제에 맞는\n기술 선택"),
    content("PROFILE", "ABOUT_DESCRIPTION_1", "성공회대학교에 재학 중인 김현우입니다. 경기경영고등학교 스마트콘텐츠과에서 웹과 게임 개발을 접한 뒤, 대회·동아리·외부 교육을 통해 개발 경험을 넓혀왔습니다."),
    content("PROFILE", "ABOUT_DESCRIPTION_2", "현재는 Spring Boot 기반 Backend 개발을 중심으로 Database 설계, Docker·Linux 실행 환경, CI/CD와 배포·운영까지 하나의 서비스 흐름으로 다룹니다. 새로운 기술의 수보다 문제와 서비스 규모에 맞는 구조를 선택하고, 실제로 운영 가능한 상태까지 완성하는 것을 중요하게 생각합니다."),
    content("PROFILE", "DEVELOPMENT_VALUE_1_TITLE", "문서화의 가치"),
    content("PROFILE", "DEVELOPMENT_VALUE_1_DESCRIPTION", "구현 결과만 남기지 않습니다. 설계와 선택의 이유를 기록해 시간이 지나도 구조와 의도를 다시 이해할 수 있도록 합니다."),
    content("PROFILE", "DEVELOPMENT_VALUE_2_TITLE", "덜어냄의 미학"),
    content("PROFILE", "DEVELOPMENT_VALUE_2_DESCRIPTION", "기술과 기능을 더하는 것보다 필요한 것만 남기는 것을 중요하게 생각합니다. 불필요한 복잡성을 줄이고 명확하고 유지보수 가능한 구조를 선택합니다."),
    content("PROFILE", "DEVELOPMENT_VALUE_3_TITLE", "운영까지"),
    content("PROFILE", "DEVELOPMENT_VALUE_3_DESCRIPTION", "구현과 배포에서 끝내지 않습니다. 로그, 모니터링, 백업과 장애 대응까지 고려해 실제로 지속 운영할 수 있는 상태를 완성의 기준으로 봅니다."),
    content("CONTACT", "EMAIL", "test-contact@example.com"),
  ],
  profileEntries: [
    { id: 1, entryType: "EDUCATION", periodText: "2023.03 — 현재", title: "소프트웨어융합전공", organization: "성공회대학교", role: null, description: null, achievement: "재학", featured: false, displayOrder: 1 },
    { id: 2, entryType: "EDUCATION", periodText: "2020.03 — 2023.02", title: "스마트콘텐츠과", organization: "경기경영고등학교", role: null, description: null, achievement: "졸업", featured: false, displayOrder: 2 },
    { id: 3, entryType: "ACTIVITY", periodText: "2026.04 — 현재", title: "QED", organization: null, role: null, description: "성공회대학교 보안동아리", achievement: null, featured: true, displayOrder: 1 },
    { id: 11, entryType: "EXPERIENCE", periodText: "2025.01 — 2025.02", title: "Backend Internship", organization: "Fixture Lab", role: "Developer", description: "독립 Fixture 활동", achievement: null, featured: false, displayOrder: 2 },
    { id: 4, entryType: "ACTIVITY", periodText: "2023.03 — 2023.12", title: "One Think IT's", organization: null, role: null, description: "특성화고 졸업자 네트워크", achievement: null, featured: false, displayOrder: 3 },
    { id: 5, entryType: "AWARD", periodText: "2026", title: "성공회대학교 소프트웨어경진대회", organization: null, role: null, description: "SKHUTRack", achievement: "1등", featured: true, displayOrder: 3 },
    { id: 6, entryType: "AWARD", periodText: "2026", title: "KFIP 2026", organization: null, role: null, description: "KYvC", achievement: "Toss 특별상", featured: true, displayOrder: 4 },
    { id: 7, entryType: "AWARD", periodText: "2023", title: "성공회대학교 IT경진대회", organization: null, role: null, description: "SKHURoad", achievement: "3등", featured: false, displayOrder: 5 },
    { id: 8, entryType: "CERTIFICATE", periodText: "2021", title: "현대오토에버 특성화 고교생 화이트해커 양성교육", organization: null, role: null, description: null, achievement: "수료/입상", featured: false, displayOrder: 6 },
    { id: 9, entryType: "AWARD", periodText: "2021", title: "SW·AI 교육 수기 공모전", organization: null, role: null, description: null, achievement: "최우수상 · 과학기술정보통신부 장관상", featured: false, displayOrder: 7 },
    { id: 10, entryType: "AWARD", periodText: "2021", title: "Hello New() World", organization: null, role: null, description: "NewLife", achievement: "대상", featured: false, displayOrder: 8 },
  ],
  portfolioTechnologies: technologies,
  projects: [
    {
      id: 1, slug: "kyvc", name: "KYvC", year: 2026, tagline: "법인 KYC 자동 심사 서비스",
      description: "법인 서류를 기반으로 KYC 심사를 자동화하고 검증 결과를 전자 증명 형태로 연결하는 서비스",
      cardRole: "백엔드 · 인프라", thumbnailUrl: "/images/profile/project-intro-kyvc.webp",
      technologies: [technologies[0], technologies[2], technologies[3], technologies[6]],
    },
    {
      id: 2, slug: "shkutrack", name: "SHKUTrack", year: 2026, tagline: "성공회대학교 졸업 관리 서비스",
      description: "졸업요건 확인과 졸업 자료, 마이크로전공, 수강 전략을 하나의 흐름으로 관리하는 서비스",
      cardRole: "풀스택 · 인프라", thumbnailUrl: "/images/profile/project-intro-skhutrack.webp",
      technologies: [technologies[0], technologies[2], technologies[3], technologies[6], technologies[9], { id: 18, name: "Nginx", category: "INFRA", iconUrl: "/icons/tech/nginx.svg", displayOrder: 14 }],
    },
    {
      id: 3, slug: "shkuload", name: "SHKULoad", year: 2023, tagline: "길찾기·중간지점·지하철 정보 서비스",
      description: "목적지 길찾기와 여러 위치의 중간지점 계산, 지하철 위치·지연정보를 제공하는 서비스",
      cardRole: "백엔드", thumbnailUrl: null,
      technologies: [
        { id: 20, name: "JavaScript", category: "LANGUAGE", iconUrl: null, displayOrder: 1 },
        { id: 21, name: "Node.js", category: "BACKEND", iconUrl: null, displayOrder: 2 },
        { id: 22, name: "Express", category: "BACKEND", iconUrl: null, displayOrder: 3 },
        { id: 23, name: "EJS", category: "FRONTEND", iconUrl: null, displayOrder: 4 },
      ],
    },
  ],
  externalLinks: [
    { id: 1, name: "GitHub", url: "https://github.com/example", displayOrder: 2 },
    { id: 2, name: "Instagram", url: "https://instagram.com/example", displayOrder: 1 },
    { id: 3, name: "LinkedIn", url: "https://linkedin.com/in/example", displayOrder: 3 },
    { id: 4, name: "Portfolio Notes", url: "https://notes.example", displayOrder: 4 },
  ],
  resume: null,
};
