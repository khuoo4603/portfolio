export type ProjectMedia = {
  label: string;
  src: string | null;
  alt: string;
  width: number;
  height: number;
};

export type EngineeringItem = {
  title: string;
  summary: string;
  problem: string;
  solution: string;
  result: string;
};

// KYvC 상세 페이지의 1차 디자인 검수용 Static View Data
export const kyvcProject = {
  title: "KYvC",
  summary:
    "법인 KYC 심사부터 Verifiable Credential 발급과 Verifiable Presentation 검증까지 하나의 흐름으로 연결한 기업 인증 플랫폼",
  period: "2026.04.27 — 2026.08.18",
  duration: "총 114일",
  role: "PL · Backend · Infra",
  teamSize: "9명",
  media: [
    { label: "KYvC 화면 01", src: null, alt: "KYvC 화면 01", width: 1600, height: 900 },
    { label: "KYvC 화면 02", src: null, alt: "KYvC 화면 02", width: 1600, height: 900 },
    { label: "KYvC 화면 03", src: null, alt: "KYvC 화면 03", width: 1600, height: 900 },
    { label: "KYvC 화면 04", src: null, alt: "KYvC 화면 04", width: 1600, height: 900 },
    { label: "KYvC 화면 05", src: null, alt: "KYvC 화면 05", width: 1600, height: 900 },
  ] satisfies ProjectMedia[],
  techStacks: [
    { name: "Next.js", mine: false, iconSrc: "/icons/tech/nextjs.svg", iconId: "nextjs" },
    { name: "React", mine: false, iconSrc: "/icons/tech/react.svg", iconId: "react" },
    { name: "TypeScript", mine: false, iconSrc: "/icons/tech/typescript.svg", iconId: "typescript" },
    { name: "Java", mine: true, iconSrc: "/icons/tech/java.svg", iconId: "java" },
    { name: "Spring Boot", mine: true, iconSrc: "/icons/tech/spring-boot.svg", iconId: "spring-boot" },
    { name: "Python", mine: false, iconSrc: "/icons/tech/python.svg", iconId: "python" },
    { name: "FastAPI", mine: false, iconSrc: "/icons/tech/fastapi.svg", iconId: "fastapi" },
    { name: "PostgreSQL", mine: true, iconSrc: "/icons/tech/postgresql.svg", iconId: "postgresql" },
    { name: "MySQL", mine: true, iconSrc: "/icons/tech/mysql.svg", iconId: "mysql" },
    { name: "Docker", mine: true, iconSrc: "/icons/tech/docker.svg", iconId: "docker" },
    { name: "Docker Compose", mine: true, iconSrc: "/icons/tech/docker.svg", iconId: "docker-compose" },
    { name: "Nginx", mine: true, iconSrc: "/icons/tech/nginx.svg", iconId: "nginx" },
    { name: "Linux", mine: true, iconSrc: "/icons/tech/linux.svg", iconId: "linux" },
    { name: "GitHub Actions", mine: true, iconSrc: "/icons/tech/github-actions.svg", iconId: "github-actions" },
    { name: "GHCR", mine: true, iconSrc: "/icons/tech/ghcr.svg", iconId: "ghcr" },
    { name: "XRPL", mine: false, iconSrc: "/icons/tech/xrpl.svg", iconId: "xrpl" },
  ],
  results: [
    {
      title: "KFIP Toss 특별상 수상",
      description: null,
    },
    {
      title: "End-to-End 서비스 흐름 구현",
      description:
        "법인 KYC 신청부터 심사, VC 발급, Wallet 저장, VP 제출·검증까지 이어지는 서비스 흐름 구현",
    },
    {
      title: "책임 분리형 서비스 구조 구성",
      description:
        "사용자 업무, 관리자 업무, Core 기술 기능, 배포 인프라의 책임을 분리한 서비스 구조 구성",
    },
  ],
  background: [
    "기존 법인 KYC는 법인 정보와 각종 증빙서류를 제출하고 심사기관이 이를 반복적으로 검토하는 과정이 필요하다.",
    "기관마다 동일하거나 유사한 법인 정보를 다시 확인해야 하고, 검증 완료된 결과를 다른 기관에서 그대로 활용하기 어렵다는 문제가 있다.",
    "KYvC는 법인 KYC 신청과 제출서류 검토를 디지털화하고, 검증이 완료된 법인 정보를 Verifiable Credential 형태로 발급하여 이후 필요한 기관에서 Verifiable Presentation 방식으로 제출·검증할 수 있도록 하는 것을 목표로 했다.",
  ],
  features: [
    {
      title: "법인 KYC 신청 및 서류 제출",
      description:
        "법인 정보 등록, KYC 신청, 증빙서류 업로드, 보완 제출, 진행 상태 확인을 하나의 사용자 Flow로 제공",
    },
    {
      title: "AI 및 관리자 KYC 심사",
      description:
        "제출 문서를 OCR / LLM 기반으로 분석하고 관리자 화면에서 추출 결과와 심사 정보를 확인하여 승인, 반려, 보완 요청 수행",
    },
    {
      title: "Verifiable Credential 발급",
      description:
        "KYC 심사가 완료된 법인에 검증 가능한 자격증명을 발급하고 발급 상태와 Credential 이력을 관리",
    },
    {
      title: "Wallet Credential 저장",
      description:
        "발급된 VC를 Android Wallet에서 수락하고 저장하여 이후 필요한 인증 과정에서 활용",
    },
    {
      title: "Verifiable Presentation 제출 및 검증",
      description:
        "금융사 등의 검증 요청에 QR 또는 Link 기반으로 VP를 제출하고 필요한 법인 정보를 검증",
    },
    {
      title: "DID / Credential 상태 관리",
      description:
        "DID와 Credential 상태 및 발급 관련 정보를 관리하고 XRPL을 이용한 상태 확인 구조를 제공",
    },
  ],
  developmentAreas: [
    {
      title: "PL",
      items: [
        "프로젝트 전체 Flow와 기술 구조 정리",
        "개발 방향 및 Architecture 결정",
        "개발 일정과 작업 분배 조율",
        "서비스 간 연동 구조 검토",
      ],
    },
    {
      title: "Backend",
      items: [
        "법인 사용자 업무 API와 KYC 업무 흐름 설계·구현",
        "법인, 사용자, KYC, 제출문서, Credential 관련 데이터 처리",
        "Core 서비스와 업무 Backend 간 연동 구조 구성",
        "관리자 심사 업무와 사용자 업무 데이터 흐름 구성",
        "Database Schema 및 Migration 관리",
      ],
    },
    {
      title: "Infra",
      items: [
        "DEV / PROD 실행환경 분리",
        "Docker / Docker Compose 기반 서비스 구성",
        "Nginx 및 Reverse Proxy 요청 구조 구성",
        "GitHub Actions 기반 CI/CD 구성",
        "GHCR Image 배포",
        "Self-hosted Runner 기반 서버 배포 흐름 구성",
        "서비스별 Environment와 Database 분리",
      ],
    },
  ],
  architecture: {
    clients: ["User Web", "Admin Web", "Core Admin"],
    services: ["Backend", "Backend Admin", "Core", "Core Admin API"],
    dataAndExternal: [
      "Business Database",
      "Core Database",
      "OCR / LLM",
      "XRPL",
      "Android Wallet",
    ],
    runtime: ["Synology DSM Reverse Proxy", "Nginx", "Docker / Docker Compose"],
    delivery: ["GitHub Actions", "GHCR", "Self-hosted Runner", "Docker / Docker Compose"],
    summary: [
      "Backend는 사용자 인증, 법인 정보, KYC 신청, 제출문서, Credential 요청과 같은 업무 기능을 담당한다.",
      "Core는 DID, VC, VP, SD-JWT, XRPL, AI 평가와 같은 기술 기능을 담당한다.",
      "Backend Admin은 Core를 직접 호출하지 않고 업무 Database에 동기화된 결과를 기준으로 관리자 업무를 처리한다.",
    ],
  },
  engineering: [
    {
      title: "업무 서비스와 Core 기술 서비스의 책임 분리",
      summary:
        "KYC 업무 로직과 DID·VC·VP·AI 기술 기능을 분리해 서비스 간 책임과 변경 범위를 명확하게 구성",
      problem:
        "KYC 업무 처리와 DID, VC, VP, XRPL, AI 평가 같은 기술 기능이 하나의 서비스에 강하게 결합되면 업무 기능 변경과 기술 Provider 변경이 서로 영향을 주고 서비스 책임이 불명확해질 수 있었다.",
      solution:
        "사용자 업무 Backend와 Core 기술 서비스를 분리하고 Backend가 필요한 기술 처리만 Core에 요청하도록 책임을 나눴다. 관리자 업무 API와 Core 운영 API 역시 별도로 구분하고 관리자 업무 Backend가 Core를 직접 호출하지 않도록 데이터 책임을 분리했다.",
      result:
        "사용자 업무, 관리자 업무, Core 기술 기능의 변경 범위를 분리하고 서비스 간 통신 경계를 명확하게 구성했다. DID·VC·VP·AI 처리 방식이 변경되더라도 업무 Backend에 미치는 영향을 줄일 수 있는 구조를 확보했다.",
    },
    {
      title: "DEV / PROD Database 및 실행환경 분리",
      summary:
        "개발과 운영 환경의 Container, Database, 설정을 분리해 환경 간 영향 범위를 차단",
      problem:
        "DEV와 PROD가 동일한 Database 또는 실행 설정을 공유하면 개발 중 변경이 운영 데이터에 영향을 줄 수 있고 배포 환경별 설정 관리가 불명확해질 수 있었다.",
      solution:
        "DEV와 PROD의 Docker Compose, Environment, Database, Network를 환경별로 분리하고 각 환경이 독립적인 Database와 Container 구성을 사용하도록 정리했다.",
      result:
        "개발 검증과 운영 환경을 분리해 데이터 오염 가능성을 줄이고 환경별 배포와 장애 대응이 독립적으로 가능하도록 구성했다.",
    },
    {
      title: "다중 서비스 CI/CD 배포 구조 구성",
      summary:
        "Frontend, Backend, Core 등 여러 서비스를 GitHub Actions와 GHCR 기반 이미지 배포 흐름으로 통합",
      problem:
        "사용자 Frontend, 관리자 Frontend, Backend, Backend Admin, Core 등 여러 서비스가 존재하여 서버에서 서비스별 Source를 직접 관리하거나 수동 배포할 경우 배포 절차가 복잡해지고 버전 정합성을 유지하기 어려웠다.",
      solution:
        "GitHub Actions에서 Branch 기준으로 각 서비스 Image를 Build하고 GHCR에 Push한 뒤 Self-hosted Runner와 Docker Compose를 이용해 서버에서 배포하도록 구성했다. develop은 DEV, main은 PROD 배포 기준으로 분리했다.",
      result:
        "서버에서 직접 Application을 Build하지 않고 동일한 Image 기반으로 환경별 배포 흐름을 관리할 수 있게 되었으며 서비스별 배포 기준과 버전 관리가 명확해졌다.",
    },
    {
      title: "KYC와 Credential 전체 Flow의 데이터 연결",
      summary:
        "법인 KYC 결과가 VC 발급과 VP 검증까지 이어질 수 있도록 업무 데이터와 Credential 상태 흐름을 연결",
      problem:
        "KYC 심사 결과, VC 발급 상태, Wallet 수락, VP 제출 및 검증 결과가 서로 다른 서비스와 단계에서 처리되기 때문에 상태 연결이 불명확하면 사용자에게 일관된 진행 상태를 제공하기 어렵다.",
      solution:
        "업무 Backend를 중심으로 법인과 KYC 상태를 관리하고 Credential 관련 기술 처리는 Core에서 처리하도록 분리하면서 필요한 상태만 업무 영역에 연결하도록 구성했다.",
      result:
        "법인 KYC 신청부터 심사, VC 발급, Wallet 활용, VP 제출·검증까지 이어지는 End-to-End Flow를 하나의 서비스 경험으로 연결할 수 있게 했다.",
    },
  ] satisfies EngineeringItem[],
} as const;
