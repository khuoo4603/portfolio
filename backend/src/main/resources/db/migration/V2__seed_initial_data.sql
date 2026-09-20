-- 포트폴리오 고정 콘텐츠 초기값
INSERT INTO portfolio_contents (category, content_code, content_value)
VALUES
    ('COMMON', 'NAME', '김현우'),
    ('COMMON', 'ENGLISH_NAME', 'KIM HYUNWOO'),
    ('COMMON', 'POSITION', 'BACKEND / INFRA DEVELOPER'),
    ('COMMON', 'AFFILIATION', '성공회대학교 소프트웨어융합전공'),
    ('MAIN', 'HERO_STATEMENT', E'문제에 맞는 기술과 설계를 선택하고,\n선택과 집중으로 서비스를 완성하는 개발자'),
    ('PROFILE', 'ABOUT_STATEMENT', E'많은 기술보다\n문제에 맞는\n기술 선택'),
    ('PROFILE', 'ABOUT_DESCRIPTION_1', '경기경영고등학교 스마트콘텐츠과에서 웹과 게임 개발을 시작했고, 현재 성공회대학교에서 Backend와 시스템 설계를 공부하고 있습니다. 대회와 팀 프로젝트를 거치며 API, Database, 서버 구성과 배포를 직접 경험했습니다.'),
    ('PROFILE', 'ABOUT_DESCRIPTION_2', '현재는 Spring Boot 기반 Backend 개발을 중심으로 PostgreSQL 설계, Docker·Linux 실행 환경, CI/CD와 배포를 직접 구성하고 있습니다. 기능 구현 뒤에도 인증·권한, 로그, 모니터링, 백업과 장애 복구 방법을 확인하며 실제 서버에서 유지할 수 있는 구조를 만드는 데 집중합니다.'),
    ('PROFILE', 'DEVELOPMENT_VALUE_1_TITLE', '문서화의 가치'),
    ('PROFILE', 'DEVELOPMENT_VALUE_1_DESCRIPTION', '구현 결과만 남기지 않습니다. 설계와 선택의 이유를 기록해 시간이 지나도 구조와 의도를 다시 이해할 수 있도록 합니다.'),
    ('PROFILE', 'DEVELOPMENT_VALUE_2_TITLE', '덜어냄의 미학'),
    ('PROFILE', 'DEVELOPMENT_VALUE_2_DESCRIPTION', '기술과 기능을 더하는 것보다 필요한 것만 남기는 것을 중요하게 생각합니다. 불필요한 복잡성을 줄이고 명확하고 유지보수 가능한 구조를 선택합니다.'),
    ('PROFILE', 'DEVELOPMENT_VALUE_3_TITLE', '운영까지'),
    ('PROFILE', 'DEVELOPMENT_VALUE_3_DESCRIPTION', '구현과 배포에서 끝내지 않습니다. 로그, 모니터링, 백업과 장애 대응까지 고려해 실제로 지속 운영할 수 있는 상태를 완성의 기준으로 봅니다.'),
    ('CONTACT', 'EMAIL', 'khuoo4603@gmail.com');

-- 프로필 이력 초기값
INSERT INTO profile_entries (
    entry_type,
    period_text,
    title,
    organization,
    role,
    description,
    achievement,
    display_order,
    enabled
)
VALUES
    ('EDUCATION', '2023.03 — 현재', '소프트웨어융합전공', '성공회대학교', NULL, NULL, '재학', 1, TRUE),
    ('EDUCATION', '2020.03 — 2023.02', '스마트콘텐츠과', '경기경영고등학교', NULL, NULL, '졸업', 2, TRUE),
    ('ACTIVITY', '2026.04 — 현재', 'QED', NULL, NULL, '성공회대학교 보안동아리', NULL, 1, TRUE),
    ('ACTIVITY', '2023.03 — 2023.12', 'One Think IT''s', NULL, NULL, '특성화고 졸업자 네트워크', NULL, 2, TRUE),
    ('AWARD', '2026', '성공회대학교 소프트웨어경진대회', '성공회대학교', NULL, 'SKHUTrack', '1등', 3, TRUE),
    ('AWARD', '2026', 'KFIP 2026', NULL, NULL, 'KYvC', 'Toss 특별상', 4, TRUE),
    ('AWARD', '2023', '성공회대학교 IT경진대회', '성공회대학교', NULL, 'SKHURoad', '3등', 5, TRUE),
    ('CERTIFICATE', '2021', '현대오토에버 특성화 고교생 화이트해커 양성교육', '현대오토에버', NULL, NULL, '수료/입상', 6, TRUE),
    ('AWARD', '2021', 'SW·AI 교육 수기 공모전', NULL, NULL, '-', '최우수상 · 과학기술정보통신부 장관상', 7, TRUE),
    ('AWARD', '2021', 'Hello New() World', NULL, NULL, 'NewLife', '대상', 8, TRUE);

-- 기술 스택 마스터 초기값
INSERT INTO technology_master (name, category, icon_url, enabled)
VALUES
    ('Java', 'LANGUAGE', '/icons/tech/java.svg', TRUE),
    ('SQL', 'LANGUAGE', '/icons/tech/sql.svg', TRUE),
    ('Spring Boot', 'BACKEND', '/icons/tech/spring-boot.svg', TRUE),
    ('PostgreSQL', 'DATABASE', '/icons/tech/postgresql.svg', TRUE),
    ('MySQL', 'DATABASE', '/icons/tech/mysql.svg', TRUE),
    ('Docker', 'INFRA', '/icons/tech/docker.svg', TRUE),
    ('Docker Compose', 'INFRA', '/icons/tech/docker.svg', TRUE),
    ('Linux', 'INFRA', '/icons/tech/linux.svg', TRUE),
    ('Kubernetes', 'INFRA', '/icons/tech/kubernetes.svg', TRUE),
    ('GitHub Actions', 'DEVOPS', '/icons/tech/github-actions.svg', TRUE),
    ('GHCR', 'DEVOPS', '/icons/tech/ghcr.svg', TRUE),
    ('Git', 'DEVOPS', '/icons/tech/git.svg', TRUE),
    ('Next.js', 'FRONTEND', '/icons/tech/nextjs.svg', TRUE),
    ('React', 'FRONTEND', '/icons/tech/react.svg', TRUE),
    ('TypeScript', 'LANGUAGE', '/icons/tech/typescript.svg', TRUE),
    ('Python', 'LANGUAGE', '/icons/tech/python.svg', TRUE),
    ('FastAPI', 'BACKEND', '/icons/tech/fastapi.svg', TRUE),
    ('Nginx', 'INFRA', '/icons/tech/nginx.svg', TRUE),
    ('XRPL', 'BACKEND', '/icons/tech/xrpl.svg', TRUE),
    ('JavaScript', 'LANGUAGE', '/icons/tech/javascript.svg', TRUE),
    ('Vite', 'FRONTEND', '/icons/tech/vite.svg', TRUE),
    ('Spring Security', 'BACKEND', '/icons/tech/spring-security.svg', TRUE),
    ('Flyway', 'DATABASE', '/icons/tech/flyway.svg', TRUE),
    ('k3s', 'INFRA', '/icons/tech/k3s.svg', TRUE),
    ('ArgoCD', 'DEVOPS', '/icons/tech/argocd.svg', TRUE);

-- 포트폴리오 메인 기술 초기값
INSERT INTO portfolio_technologies (technology_id, display_order)
SELECT technology.id, seed.display_order
FROM (
    VALUES
        ('Java', 1),
        ('SQL', 2),
        ('Spring Boot', 3),
        ('PostgreSQL', 4),
        ('MySQL', 5),
        ('Docker', 6),
        ('Docker Compose', 7),
        ('Linux', 8),
        ('Kubernetes', 9),
        ('GitHub Actions', 10),
        ('GHCR', 11),
        ('Git', 12),
        ('JavaScript', 13),
        ('Vite', 14),
        ('Nginx', 15),
        ('Spring Security', 16),
        ('Flyway', 17),
        ('k3s', 18),
        ('ArgoCD', 19)
) AS seed(name, display_order)
JOIN technology_master AS technology ON technology.name = seed.name;

-- 프로젝트 초기값
INSERT INTO projects (
    slug,
    name,
    year,
    tagline,
    description,
    card_role,
    summary,
    detail_role,
    started_at,
    ended_at,
    team_size,
    thumbnail_storage_key,
    display_order,
    enabled
)
VALUES
    (
        'portfolio',
        'Portfolio',
        2026,
        '개인 포트폴리오·운영 도구 플랫폼',
        '프로필과 프로젝트를 공개하고 Admin에서 콘텐츠·계정·파일·서비스 상태를 관리하는 개인 웹 플랫폼',
        '풀스택 · 인프라',
        '포트폴리오를 웹에서 쉽고 빠르게 관리할 수 있도록 만든 개인 포트폴리오 서비스입니다. 누구나 볼 수 있는 포트폴리오 화면과 Runtime에서 콘텐츠와 상태를 관리할 수 있는 Admin, 프로젝트와 학업에 활용하는 Tools를 함께 제공합니다.',
        'Full Stack · Infra',
        DATE '2026-08-22',
        NULL,
        1,
        NULL,
        1,
        TRUE
    ),
    (
        'kyvc',
        'KYvC',
        2026,
        '법인 KYC 심사·전자 자격증명 서비스',
        '법인 증빙서류를 OCR·LLM으로 분석하고 심사된 법인 정보를 VC로 발급해 VP 검증에 활용하는 KYC 서비스',
        '백엔드 · 인프라',
        '법인 KYC 신청·서류 심사, VC 발급, Wallet 보관, VP 제출·검증을 구현한 법인 인증 프로젝트',
        'PL · Backend · Infra',
        DATE '2026-04-27',
        DATE '2026-08-18',
        9,
        NULL,
        2,
        TRUE
    ),
    (
        'shkutrack',
        'SKHUTrack',
        2026,
        '성공회대학교 졸업요건 관리 서비스',
        '수강 이력을 바탕으로 총학점·교양·SEED·전공·전공탐색 요건과 부족 항목을 계산하고 성적·마이크로전공·자료를 관리하는 서비스',
        '풀스택 · 인프라',
        '성공회대학교 학생을 위한 수강 이력 및 졸업요건, 포트폴리오 등 성공적인 졸업을 서포트하는 졸업관리 서비스',
        'Full Stack · Infra',
        DATE '2026-02-10',
        NULL,
        1,
        NULL,
        3,
        TRUE

    );

-- 기존 정적 대표 이미지를 단일 Persistent Storage로 복원할 Seed Key
UPDATE projects
SET thumbnail_storage_key = 'projects/' || id || '/thumbnail/2a22886f-378c-45cd-8548-4f93b9036594.webp'
WHERE slug = 'kyvc';

-- 프로젝트 기술 연결 초기값
INSERT INTO project_technologies (
    project_id,
    technology_id,
    show_on_card,
    highlighted,
    display_order
)
SELECT project.id, technology.id, seed.show_on_card, seed.highlighted, seed.display_order
FROM (
    VALUES
        ('kyvc', 'Next.js', FALSE, FALSE, 1),
        ('kyvc', 'React', FALSE, FALSE, 2),
        ('kyvc', 'TypeScript', FALSE, FALSE, 3),
        ('kyvc', 'Java', TRUE, TRUE, 4),
        ('kyvc', 'Spring Boot', TRUE, TRUE, 5),
        ('kyvc', 'Python', FALSE, FALSE, 6),
        ('kyvc', 'FastAPI', FALSE, FALSE, 7),
        ('kyvc', 'PostgreSQL', TRUE, TRUE, 8),
        ('kyvc', 'MySQL', FALSE, TRUE, 9),
        ('kyvc', 'Docker', TRUE, TRUE, 10),
        ('kyvc', 'Docker Compose', FALSE, TRUE, 11),
        ('kyvc', 'Nginx', FALSE, TRUE, 12),
        ('kyvc', 'Linux', FALSE, TRUE, 13),
        ('kyvc', 'GitHub Actions', FALSE, TRUE, 14),
        ('kyvc', 'GHCR', FALSE, TRUE, 15),
        ('kyvc', 'XRPL', FALSE, FALSE, 16),
        ('portfolio', 'Next.js', FALSE, TRUE, 1),
        ('portfolio', 'React', FALSE, TRUE, 2),
        ('portfolio', 'TypeScript', FALSE, TRUE, 3),
        ('portfolio', 'Java', TRUE, TRUE, 4),
        ('portfolio', 'Spring Boot', TRUE, TRUE, 5),
        ('portfolio', 'PostgreSQL', TRUE, TRUE, 6),
        ('portfolio', 'Docker', TRUE, TRUE, 7),
        ('portfolio', 'Docker Compose', FALSE, TRUE, 8),
        ('portfolio', 'Linux', FALSE, TRUE, 9),
        ('portfolio', 'GitHub Actions', FALSE, TRUE, 10),
        ('portfolio', 'GHCR', FALSE, TRUE, 11),
        ('portfolio', 'Git', FALSE, TRUE, 12),
        ('shkutrack', 'JavaScript', FALSE, TRUE, 1),
        ('shkutrack', 'Vite', FALSE, TRUE, 2),
        ('shkutrack', 'Nginx', FALSE, TRUE, 3),
        ('shkutrack', 'Java', TRUE, TRUE, 4),
        ('shkutrack', 'Spring Boot', TRUE, TRUE, 5),
        ('shkutrack', 'Spring Security', FALSE, TRUE, 6),
        ('shkutrack', 'Flyway', FALSE, TRUE, 7),
        ('shkutrack', 'PostgreSQL', TRUE, TRUE, 8),
        ('shkutrack', 'Docker', FALSE, TRUE, 9),
        ('shkutrack', 'k3s', TRUE, TRUE, 10),
        ('shkutrack', 'GitHub Actions', FALSE, TRUE, 11),
        ('shkutrack', 'GHCR', FALSE, TRUE, 12),
        ('shkutrack', 'ArgoCD', FALSE, TRUE, 13)
) AS seed(project_slug, technology_name, show_on_card, highlighted, display_order)
JOIN projects AS project ON project.slug = seed.project_slug
JOIN technology_master AS technology ON technology.name = seed.technology_name;

-- 프로젝트 상세 콘텐츠 초기값
INSERT INTO project_contents (
    project_id,
    results_json,
    overview_json,
    development_json,
    architecture_json,
    architecture_image_storage_key,
    engineering_json
)
SELECT
    project.id,
    $json$[
      {"title": "KFIP Toss 특별상 수상"},
      {"title": "Toss PoC 협의 단계 진입"},
      {"title": "BKL 법률 검토 단계 진입"}
    ]$json$::jsonb,
    $json$[
      {"title": "반복되는 법인 KYC 심사", "body": "법인 고객을 받는 금융·핀테크 서비스는 사업자등록증과 법인등기사항전부증명서 등 여러 증빙을 확인하고, 법인 정보와 제출서류가 일치하는지 사람이 반복해서 검토해야 합니다."},
      {"title": "기관마다 다시 제출되는 증빙", "body": "한 기관에서 심사를 마쳐도 다른 기관에서는 기존 결과를 그대로 신뢰하기 어려워 같은 법인 정보와 서류를 다시 제출받는 경우가 많습니다. 법인은 제출을 반복하고 심사기관은 이미 확인된 항목을 다시 검토하게 됩니다."},
      {"title": "검증 결과를 자격증명으로 활용", "body": "KYvC는 제출서류를 OCR·LLM으로 분석한 뒤 관리자 심사를 거쳐 확인된 법인 정보를 VC로 발급합니다. 법인은 Wallet에 보관한 자격증명을 VP로 제출하고, 검증기관은 원본 서류 전체를 다시 받지 않고 필요한 정보와 자격증명 상태를 확인할 수 있도록 설계했습니다."}
    ]$json$::jsonb,
    $json$[
      {
        "title": "PL",
        "items": [
          "KYC 신청·심사·VC 발급·VP 검증의 서비스 경계와 책임 정의",
          "Frontend, Backend, Admin, Core 간 API 호출 방향과 데이터 책임 기준 수립",
          "개발 일정과 담당 영역 조율",
          "DEV / PROD 배포 기준과 브랜치 운영 정책 정리"
        ]
      },
      {
        "title": "Backend",
        "items": [
          "법인·사용자·KYC·제출문서·Credential 업무 API 설계·구현",
          "KYC 심사 상태와 보완 제출, VC 발급 상태를 업무 DB 기준으로 관리",
          "CoreAdapter를 통한 OCR·LLM·DID·VC·VP 처리 요청과 결과 반영",
          "Backend와 Backend Admin의 업무 책임 분리",
          "PostgreSQL Schema와 Flyway Migration 관리"
        ]
      },
      {
        "title": "Infra",
        "items": [
          "DEV / PROD Docker Compose·Network·Database 분리",
          "Synology DSM Reverse Proxy와 Nginx의 외부·내부 라우팅 책임 분리",
          "서비스별 Docker Image와 GHCR Registry 운영",
          "develop / main 기준 GitHub Actions 배포 Workflow 구성",
          "Self-hosted Runner에서 서비스별 배포와 Health Check 수행"
        ]
      }
    ]$json$::jsonb,
    $json$ {
      "notes": [
        {
          "title": "인프라 / 실행 환경",
          "body": "외부 도메인의 진입점은 Synology DSM Reverse Proxy에 두고, 애플리케이션 라우팅과 정적 파일 처리는 Nginx, 서비스 실행은 Docker Compose가 담당하도록 역할을 나눴습니다. NAS의 외부 네트워크 설정은 유지하면서 애플리케이션 포트는 내부에 한정하고, 서비스별 Container를 독립적으로 교체할 수 있는 구조를 우선했습니다."
        },
        {
          "title": "인프라 / 배포",
          "body": "서버에서 소스를 직접 Build하지 않도록 GitHub Actions에서 서비스별 Docker Image를 만들고 GHCR에 저장한 뒤 Self-hosted Runner가 배포하도록 구성했습니다. develop과 main의 DEV·PROD 배포 기준을 분리하고 동일한 Image 단위로 버전을 관리해 여러 서비스의 배포 절차와 재배포 기준을 일정하게 유지하는 것을 우선했습니다."
        }
      ]
    }$json$::jsonb,
    'projects/' || project.id || '/architecture/b2051589-7615-4bc8-aec5-f48f6ec84653.png',
    $json$[
      {
        "title": "업무 API와 Core 기술 기능 분리",
        "summary": "KYC 업무 데이터와 DID·VC·VP·AI 처리의 변경 범위를 분리",
        "problem": "KYC 업무 로직과 DID·VC·VP·XRPL·AI 처리를 한 서비스에 두면 업무 변경과 기술 Provider 변경이 서로 영향을 주고, 관리자 API가 Core 세부 구현에 의존하게 됩니다.",
        "solution": "법인·KYC·문서·심사는 Backend 업무 DB가 책임지고 DID·VC·VP·SD-JWT·XRPL·OCR·LLM 처리는 Core가 책임지도록 분리했습니다. Backend는 CoreAdapter를 통해 필요한 기술 처리를 요청하고, Backend Admin은 Core를 직접 호출하지 않고 업무 DB에 반영된 결과를 조회하도록 했습니다.",
        "result": "업무 API와 기술 Provider의 변경 범위를 분리했고, Core 구현이 바뀌어도 관리자·사용자 업무 API가 Core의 Raw Payload에 직접 의존하지 않도록 했습니다."
      },
      {
        "title": "DEV / PROD 데이터와 실행환경 분리",
        "summary": "개발 중 변경이 운영 Database와 Container에 영향을 주지 않도록 환경을 분리",
        "problem": "DEV와 PROD가 동일한 Database나 Container 설정을 공유하면 개발 중 Schema·환경 변수·배포 변경이 운영 데이터와 실행환경에 영향을 줄 수 있습니다.",
        "solution": "DEV와 PROD의 Docker Compose, Network, Environment와 Database를 각각 분리하고 환경별 Domain과 Container를 독립적으로 실행하도록 구성했습니다.",
        "result": "개발 검증 중 발생한 Database와 Container 변경의 영향 범위를 DEV에 한정하고, 운영 환경을 별도의 설정과 데이터로 유지할 수 있게 했습니다."
      },
      {
        "title": "서비스별 Image 배포 기준 통일",
        "summary": "여러 Frontend·Backend·Core 서비스를 같은 Image 배포 방식으로 관리",
        "problem": "Frontend, Backend, Backend Admin, Core 등 여러 서비스를 서버에서 직접 Build하거나 서비스마다 다른 방식으로 배포하면 버전과 배포 절차를 추적하기 어렵습니다.",
        "solution": "GitHub Actions에서 Branch와 서비스 단위로 Docker Image를 Build해 GHCR에 저장하고, Self-hosted Runner가 대상 환경에서 Docker Compose 배포와 Health Check를 수행하도록 구성했습니다. develop은 DEV, main은 PROD 기준으로 분리했습니다.",
        "result": "서버에서 Source Build를 수행하지 않고 동일한 Image 기준으로 서비스를 교체할 수 있게 되었으며, 서비스별 배포 대상과 환경 기준을 명확하게 유지할 수 있게 됐습니다."
      },
      {
        "title": "KYC와 Credential 상태의 책임 분리",
        "summary": "사용자에게 필요한 업무 상태와 Core 내부 자격증명 처리를 구분",
        "problem": "KYC 심사, VC 발급, Wallet 수락, VP 검증은 서로 다른 단계와 서비스에서 처리되기 때문에 각 상태의 기준이 여러 곳에 흩어지면 사용자에게 표시할 진행 상태와 재처리 기준이 불명확해집니다.",
        "solution": "법인·KYC·문서·심사 상태는 Backend 업무 DB를 기준으로 관리하고 DID·VC·VP와 XRPL 처리는 Core가 담당하도록 했습니다. Core 처리 결과 중 업무 화면에 필요한 상태만 Backend에 반영하도록 책임 범위를 나눴습니다.",
        "result": "사용자 화면과 관리자 화면은 업무 DB를 일관된 상태 기준으로 사용할 수 있고, Credential의 기술 처리 세부사항은 Core 내부에 유지할 수 있게 됐습니다."
      }
    ]$json$::jsonb
FROM projects AS project
WHERE project.slug = 'kyvc';

INSERT INTO project_contents (project_id, results_json, overview_json, development_json, architecture_json, architecture_image_storage_key, engineering_json)
SELECT project.id,
  $json$[{"title":"운영 중에도 설정을 바꿀 수 있는 관리 구조 설계"}]$json$::jsonb,
  $json$[{"title":"가끔 수정할수록 더 번거로운 포트폴리오","body":"포트폴리오는 매일 수정하는 서비스가 아니다 보니 오랜만에 내용을 바꾸려고 하면 코드 구조부터 다시 확인해야 했습니다. 문구 하나나 프로젝트 정보 하나를 고치는 데도 소스를 수정하고 다시 배포해야 했습니다. 반대로 공개 포트폴리오 중에는 화려한 효과와 정보가 너무 많아 정작 중요한 내용을 찾기 어렵거나, Hover를 해야만 내용을 볼 수 있어 읽는 데 피로한 경우도 많았습니다."},{"title":"코드를 열지 않고 관리하고, 핵심은 바로 보이게","body":"콘텐츠를 바꿀 때마다 코드를 다시 읽지 않아도 되도록 Admin에서 프로필, 프로젝트, 파일과 서비스 상태를 관리할 수 있게 만들었습니다. 서버 상태도 직접 확인하기 전에 이상을 감지하고 복구할 수 있도록 Monitoring과 배포 복구 절차를 두었습니다. 공개 화면은 Hover를 해야만 내용을 읽을 수 있는 구조나 과도한 애니메이션을 피하고, 필요한 정보가 처음부터 보이도록 구성했습니다."},{"title":"개발과 학업에 쓰는 개인 도구","body":"프로젝트를 진행할 때 자주 찾는 문서와 레퍼런스, 개발 환경을 구성할 때 반복해서 확인하는 링크를 한곳에 정리하고 싶었습니다. 학업에서도 기존 프로그램에 맞추기보다 Quiz나 암·복호화처럼 실제로 필요한 기능을 직접 만들어 쓰고, 이후 필요한 도구를 계속 추가할 수 있도록 Tools 영역을 따로 두었습니다."}]$json$::jsonb,
  $json$[{"title":"Backend","items":["Spring Security·Spring Session JDBC로 ADMIN 로그인과 세션 관리","OTP Challenge로 로그인·민감 작업 재인증","프로필·프로젝트·기술·외부 링크·Resume의 Public/Admin API 구현","프로젝트 이미지·Resume·Tool 이미지의 저장·교체·삭제 처리","서비스 상태, 로그인·에러 로그, 방문 통계 조회 기능 구현"]},{"title":"Frontend","items":["Public Portfolio·Project Detail 반응형 화면 구현","Site·Project·Account·Monitoring·Tools Admin 화면 구현","Quiz·Links와 ADMIN 인증 흐름 구현","초기 API 병렬 요청, ETag, Hero Map 지연 로딩으로 첫 화면 성능 개선"]},{"title":"Infra","items":["DEV / PROD Docker Compose·Network·PostgreSQL 분리","Synology DSM Reverse Proxy는 외부 요청, Ubuntu Mini PC는 애플리케이션 실행 담당","업로드 파일을 NAS에 저장해 Container 교체 후에도 파일 유지","GitHub Actions에서 SHA Image Build, GHCR 저장, Self-hosted Runner 배포","Health Check·Smoke Test·자동 Rollback·Database Backup Script 구성"]}]$json$::jsonb,
  $json$ {"notes":[{"title":"인프라 / 실행 환경","body":"외부 요청과 도메인 처리는 Synology DSM Reverse Proxy가 맡고, Frontend·Backend·Monitoring Container는 Ubuntu Mini PC에서 실행합니다. 업로드 파일은 NAS에 따로 저장해 Container를 교체해도 파일이 남도록 했습니다."},{"title":"인프라 / 배포","body":"GitHub Actions가 Commit SHA로 Image를 만들어 GHCR에 올리면 Self-hosted Runner가 변경된 Component만 교체합니다. 배포 직후 Health Check와 Smoke Test를 실행하고, 실패하면 직전 정상 Image로 되돌립니다. 서버에서 직접 Source를 Build하지 않는 방식으로 배포 절차를 고정했습니다."}]}$json$::jsonb,
  NULL,
  $json$[{"title":"코드 수정 없이 운영 설정 변경","summary":"콘텐츠와 모니터링 설정을 Admin에서 바로 수정","problem":"프로필 문구, 프로젝트 정보, Tool 상태, Monitoring URL처럼 자주 바뀌는 값까지 코드나 환경변수에 넣으면 작은 수정에도 다시 빌드하고 배포해야 합니다.","solution":"프로필·프로젝트·기술·Tool 정보는 DB에서 관리하고 Admin에서 수정하게 했습니다. 모니터링도 설정과 Target을 별도 Table로 두어 활성 여부, URL, Timeout, Retry, 실행 주기를 운영 중에 바꿀 수 있습니다.","result":"문구나 모니터링 설정을 바꾸기 위해 애플리케이션을 다시 배포할 필요가 없어졌습니다. 코드 변경이 필요한 작업과 운영 중 조정할 값을 구분했습니다."},{"title":"DB와 파일 저장 상태 맞추기","summary":"DB 저장이 실패해도 기존 파일은 남기고 새 파일만 정리","problem":"프로젝트 이미지나 Resume는 DB에 Storage Key를 저장하고 실제 파일은 NAS에 둡니다. 변경 순서가 어긋나면 DB는 이전 값인데 새 파일만 남거나, 기존 파일을 먼저 지워 복구하지 못하는 상황이 생길 수 있습니다.","solution":"새 파일을 다른 Storage Key에 먼저 저장한 뒤 DB를 갱신하고, Transaction이 끝난 뒤 기존 파일을 삭제합니다. DB 저장이 실패하면 이번 요청에서 만든 새 파일만 지우고 기존 파일과 Key는 그대로 둡니다.","result":"DB Rollback이 발생해도 기존 공개 파일을 유지하고, 실패한 요청에서 생긴 고아 파일도 남지 않게 했습니다."}]$json$::jsonb
FROM projects AS project WHERE project.slug = 'portfolio';

INSERT INTO project_contents (project_id, results_json, overview_json, development_json, architecture_json, architecture_image_storage_key, engineering_json)
SELECT project.id,
  $json$[{"title":"성공회대학교 소프트웨어경진대회 1등"}]$json$::jsonb,
  $json$[{"title":"보기 어려웠던 졸업요건","body":"학교의 졸업요건은 총학점뿐 아니라 교양, SEED, 전공, 전공탐색처럼 확인해야 할 기준이 많고 정보도 여러 곳에 나뉘어 있어 한눈에 파악하기 어려웠습니다. 기존 시스템에서는 이미 이수한 학기까지의 결과를 확인하는 데 그쳐, 앞으로 들을 과목까지 넣어보며 졸업 시점을 미리 계산하기도 어려웠습니다."},{"title":"수강계획 시뮬레이션","body":"앞으로 들을 과목을 학기별로 미리 넣어보고, 해당 계획대로 수강했을 때 총학점과 졸업요건이 어떻게 달라지는지 확인할 수 있게 했습니다. 언제 어떤 수업을 들어야 부족한 학점을 채울 수 있는지 여러 계획을 직접 비교해볼 수 있습니다."},{"title":"부족한 졸업요건을 한눈에","body":"현재 수강 이력과 입력한 수강계획을 기준으로 총학점, 교양, SEED, 전공필수·전공선택, 전공탐색의 충족 여부를 계산합니다. 단순히 졸업 가능 여부만 보여주는 것이 아니라 필요한 학점과 현재 학점, 부족한 학점을 항목별로 확인할 수 있게 했습니다."}]$json$::jsonb,
  $json$[{"title":"Backend","items":["수강내역·성적·졸업판정·마이크로전공 API 설계 및 구현","graduation_template과 전공·교양 Rule 데이터를 이용한 졸업 판정 구조 구현","교양·SEED·전공·전공탐색 Evaluator 분리","재수강 연결 관계를 기준으로 최신 수강 이력만 판정에 반영하는 공통 정책 구현","졸업요건 미충족 영역별 필요·취득·부족 학점 계산","PostgreSQL Schema와 Flyway Migration 관리"]},{"title":"Frontend","items":["Vanilla JavaScript와 Vite 기반 사용자 화면 구현","성적 Dashboard와 수강내역 관리 화면 구현","졸업 판정 결과와 부족 요건 표시","마이크로전공 이수 현황 화면 구현","사용자 자료함 화면 구현"]},{"title":"Infra","items":["Frontend / Backend Docker Image 분리","GitHub Actions에서 Commit SHA 기반 Image를 GHCR에 Push","k3s에서 DEV / PROD Namespace와 Manifest 분리","Kustomize Overlay로 환경별 Image Tag 관리","ArgoCD를 이용해 Git에 기록된 Manifest 상태를 Cluster에 반영"]}]$json$::jsonb,
  $json$ {"notes":[{"title":"백엔드 / 졸업 판정","body":"졸업요건을 Service 안의 조건문으로 한 번에 계산하지 않고 총학점·교양·SEED·전공·전공탐색 판정을 각각 분리했습니다. 졸업 Template과 전공·교양 Rule은 Database에서 읽고, 공통 전처리를 거친 수강 이력을 각 Evaluator가 자신의 기준으로 계산하도록 구성해 학칙 기준과 계산 책임이 섞이지 않도록 했습니다."},{"title":"인프라 / 배포","body":"GitHub Actions는 Frontend와 Backend Image를 Commit SHA 기준으로 Build해 GHCR에 저장하고, DEV 배포 Workflow는 Kustomize Overlay의 Image Tag를 해당 SHA로 변경합니다. ArgoCD가 Git에 기록된 Manifest를 k3s Cluster에 반영하도록 구성해 서버에서 직접 Image Tag를 수정하는 대신 Git의 배포 상태를 기준으로 DEV·PROD 환경을 관리했습니다."}]}$json$::jsonb,
  NULL,
  $json$[{"title":"졸업요건 계산을 Rule과 Evaluator로 분리","summary":"학칙 조건을 하나의 거대한 조건문으로 고정하지 않도록 판정 책임을 분리","problem":"졸업 여부는 총학점 하나로 결정되지 않고 교양, SEED 영역, 전공필수·전공선택, 전공탐색 등 서로 다른 규칙을 동시에 만족해야 합니다. 이 조건을 Service의 if문으로 직접 누적하면 규칙 하나가 변경될 때 전체 판정 로직을 다시 확인해야 합니다.","solution":"졸업요건 Template과 전공·교양 Rule을 Database 데이터로 두고, CultureEvaluator, SeedEvaluator, MajorEvaluator, MajorExplorationEvaluator, OverallEvaluator로 판정 책임을 분리했습니다. 각 Evaluator의 결과를 GraduationEvaluationService가 조합하고 MissingItemsBuilder가 부족한 항목을 응답 형태로 생성하도록 구성했습니다.","result":"교양·SEED·전공 등 서로 다른 졸업요건 계산이 독립된 단위로 분리되어 각 규칙의 입력값과 계산 결과를 개별적으로 확인할 수 있게 했습니다."},{"title":"재수강 과목의 중복 학점 반영 방지","summary":"재수강 연결 관계에서 최종 수강 기록 하나만 졸업 판정에 반영","problem":"같은 과목을 재수강한 경우 원본과 재수강 이력을 모두 합산하면 취득학점과 졸업요건 계산이 중복됩니다. 재수강이 여러 번 이어진 경우 단순히 과목 코드만 비교해서는 어떤 수강 기록을 최종 결과로 사용할지 결정하기 어렵습니다.","solution":"retake_course_id를 따라 같은 재수강 그룹을 찾고, 수강 연도가 가장 최근인 기록을 우선했습니다. 같은 연도에서는 1학기 → 여름학기 → 2학기 → 겨울학기 순서로 최신 학기를 판단하고, 연도와 학기까지 같으면 course_id를 마지막 기준으로 사용했습니다. 이후 F와 NP는 취득학점 계산에서 제외했습니다.","result":"재수강 횟수와 관계없이 하나의 최종 수강 기록만 졸업 판정과 성적 계산에 사용하도록 기준을 통일했습니다."}]$json$::jsonb
FROM projects AS project WHERE project.slug = 'shkutrack';

-- 프로젝트 미디어 초기값 제외

-- 외부 링크 초기값
INSERT INTO external_links (name, url, display_order, enabled)
VALUES
    ('Instagram', 'https://www.instagram.com/hyun_woooooooooo/', 1, TRUE),
    ('GitHub', 'https://github.com/khuoo4603', 2, TRUE),
    ('LinkedIn', 'https://www.linkedin.com/in/%ED%98%84%EC%9A%B0-%EA%B9%80-b0201a414/', 3, TRUE);

-- Tool Registry 초기값
INSERT INTO tools (tool_key, name, enabled)
VALUES
    ('QUIZ', 'Quiz', TRUE),
    ('LINKS', 'Links', TRUE);

-- Links Tool 초기값
INSERT INTO tool_links (name, description, url, category, display_order, enabled)
VALUES
    ('React Bits', 'Public Background / Shader / Noise / Hover / Text Interaction 레퍼런스', 'https://reactbits.dev/', 'REFERENCE', 1, TRUE),
    ('Aceternity UI', 'Public UI / Interaction / Project Showcase 레퍼런스', 'https://ui.aceternity.com/', 'REFERENCE', 2, TRUE),
    ('Magic UI', 'Admin / Tools UI Component 레퍼런스', 'https://magicui.design/', 'REFERENCE', 3, TRUE),
    ('Color Hunt', '컬러 팔레트 탐색 및 색 조합 레퍼런스', 'https://colorhunt.co/', 'REFERENCE', 4, TRUE),
    ('Adobe Color', '컬러 팔레트 생성 및 색 조합 탐색', 'https://color.adobe.com/', 'REFERENCE', 5, TRUE),
    ('Happy Hues', '컬러 팔레트와 실제 UI 적용 예시', 'https://www.happyhues.co/', 'REFERENCE', 6, TRUE),
    ('Realtime Colors', '웹 화면에서 색 조합을 실시간으로 확인하는 도구', 'https://www.realtimecolors.com/', 'REFERENCE', 7, TRUE),
    ('KYvC', 'KYvC 서비스', 'https://kyvc.kr/', 'MY_SERVICES', 1, TRUE),
    ('KYvC Intro', 'KYvC 소개 페이지', 'https://intro.kyvc.kr/', 'MY_SERVICES', 2, TRUE),
    ('SKHUTrack', 'SKHUTrack 서비스', 'https://skhutrack.com/', 'MY_SERVICES', 3, TRUE),
    ('khuoo.synology.me', '개인 서비스', 'https://khuoo.synology.me/', 'MY_SERVICES', 4, TRUE);

INSERT INTO monitoring_settings (
    id,
    enabled,
    check_interval_seconds,
    connect_timeout_ms,
    request_timeout_ms,
    retry_delay_ms,
    max_retries
) VALUES (1, TRUE, 300, 2000, 3000, 500, 1);

INSERT INTO monitoring_targets (
    service_key,
    display_name,
    health_url,
    enabled,
    display_order
) VALUES
    ('PORTFOLIO_FRONTEND', 'Portfolio Frontend', 'http://frontend:3000/healthz', TRUE, 1),
    ('PORTFOLIO_BACKEND', 'Portfolio Backend', 'http://backend:8080/actuator/health', TRUE, 2),
    ('KYVC_FRONTEND', 'KYvC Frontend', NULL, FALSE, 3),
    ('KYVC_BACKEND', 'KYvC Backend', NULL, FALSE, 4),
    ('KYVC_CORE', 'KYvC Core', NULL, FALSE, 5),
    ('SHKUTRACK', 'SHKUTrack', NULL, FALSE, 6);
