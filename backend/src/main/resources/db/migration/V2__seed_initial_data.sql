-- 포트폴리오 고정 콘텐츠 초기값
INSERT INTO portfolio_contents (category, content_code, content_value)
VALUES
    ('COMMON', 'NAME', '김현우'),
    ('COMMON', 'ENGLISH_NAME', 'KIM HYUNWOO'),
    ('COMMON', 'POSITION', 'BACKEND / INFRA DEVELOPER'),
    ('COMMON', 'AFFILIATION', '성공회대학교 소프트웨어융합전공'),
    ('MAIN', 'HERO_STATEMENT', E'Backend 개발부터\n배포 / 운영까지 고려'),
    ('MAIN', 'HERO_DESCRIPTION', E'문제에 맞는 기술 선택\n서비스 설계 · 구현 · 실제 운영'),
    ('PROFILE', 'ABOUT_STATEMENT', E'많은 기술보다\n문제에 맞는\n기술 선택'),
    ('PROFILE', 'ABOUT_DESCRIPTION_1', '성공회대학교에 재학 중인 김현우입니다. 경기경영고등학교 스마트콘텐츠과에서 웹과 게임 개발을 접한 뒤, 대회·동아리·외부 교육을 통해 개발 경험을 넓혀왔습니다.'),
    ('PROFILE', 'ABOUT_DESCRIPTION_2', '현재는 Spring Boot 기반 Backend 개발을 중심으로 Database 설계, Docker·Linux 실행 환경, CI/CD와 배포·운영까지 하나의 서비스 흐름으로 다룹니다. 새로운 기술의 수보다 문제와 서비스 규모에 맞는 구조를 선택하고, 실제로 운영 가능한 상태까지 완성하는 것을 중요하게 생각합니다.'),
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
    ('ACTIVITY', '2026.04 — 현재', 'QED', '성공회대학교', NULL, '성공회대학교 보안동아리', NULL, 1, TRUE),
    ('ACTIVITY', '2023.03 — 2023.12', 'One Think IT''s', NULL, NULL, '특성화고 졸업자 네트워크', NULL, 2, TRUE),
    ('AWARD', '2026', '성공회대학교 소프트웨어경진대회', '성공회대학교', NULL, 'SKHUTRack', '1등', 3, TRUE),
    ('AWARD', '2026', 'KFIP 2026', NULL, NULL, 'KYvC', 'Toss 특별상', 4, TRUE),
    ('AWARD', '2023', '성공회대학교 IT경진대회', '성공회대학교', NULL, 'SKHURoad', '3등', 5, TRUE),
    ('CERTIFICATE', '2021', '현대오토에버 특성화 고교생 화이트해커 양성교육', '현대오토에버', NULL, NULL, '수료/입상', 6, TRUE),
    ('AWARD', '2021', 'SW·AI 교육 수기 공모전', NULL, NULL, NULL, '최우수상 · 과학기술정보통신부 장관상', 7, TRUE),
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
    ('JavaScript', 'LANGUAGE', NULL, TRUE),
    ('Node.js', 'BACKEND', NULL, TRUE),
    ('Express', 'BACKEND', NULL, TRUE),
    ('EJS', 'FRONTEND', NULL, TRUE);

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
        ('Git', 12)
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
        'kyvc',
        'KYvC',
        2026,
        '법인 KYC 자동 심사 서비스',
        '법인 서류를 기반으로 KYC 심사를 자동화하고 검증 결과를 전자 증명 형태로 연결하는 서비스',
        '백엔드 · 인프라',
        '법인 KYC 심사부터 Verifiable Credential 발급과 Verifiable Presentation 검증까지 하나의 흐름으로 연결한 기업 인증 플랫폼',
        'PL · Backend · Infra',
        DATE '2026-04-27',
        DATE '2026-08-18',
        9,
        NULL,
        1,
        TRUE
    ),
    (
        'shkutrack',
        'SHKUTrack',
        2026,
        '성공회대학교 졸업 관리 서비스',
        '졸업요건 확인과 졸업 자료, 마이크로전공, 수강 전략을 하나의 흐름으로 관리하는 서비스',
        '풀스택 · 인프라',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        2,
        FALSE
    ),
    (
        'shkuload',
        'SHKULoad',
        2023,
        '길찾기·중간지점·지하철 정보 서비스',
        '목적지 길찾기와 여러 위치의 중간지점 계산, 지하철 위치·지연정보를 제공하는 서비스',
        '백엔드',
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        NULL,
        3,
        FALSE
    );

-- 기존 정적 대표 이미지를 단일 Persistent Storage로 복원할 Seed Key
UPDATE projects
SET thumbnail_storage_key = 'projects/' || id || '/thumbnail/2a22886f-378c-45cd-8548-4f93b9036594.webp'
WHERE slug = 'kyvc';

UPDATE projects
SET thumbnail_storage_key = 'projects/' || id || '/thumbnail/383297dd-5394-5945-2c56-050f58034417.webp'
WHERE slug = 'shkutrack';

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
        ('shkutrack', 'Java', TRUE, FALSE, 1),
        ('shkutrack', 'Spring Boot', TRUE, FALSE, 2),
        ('shkutrack', 'PostgreSQL', TRUE, FALSE, 3),
        ('shkutrack', 'Docker', TRUE, FALSE, 4),
        ('shkutrack', 'Kubernetes', TRUE, FALSE, 5),
        ('shkutrack', 'Nginx', TRUE, FALSE, 6),
        ('shkuload', 'JavaScript', TRUE, FALSE, 1),
        ('shkuload', 'Node.js', TRUE, FALSE, 2),
        ('shkuload', 'Express', TRUE, FALSE, 3),
        ('shkuload', 'EJS', TRUE, FALSE, 4)
) AS seed(project_slug, technology_name, show_on_card, highlighted, display_order)
JOIN projects AS project ON project.slug = seed.project_slug
JOIN technology_master AS technology ON technology.name = seed.technology_name;

-- 프로젝트 상세 콘텐츠 초기값
INSERT INTO project_contents (
    project_id,
    results_json,
    background_json,
    features_json,
    development_json,
    architecture_json,
    architecture_image_storage_key,
    engineering_json
)
SELECT
    project.id,
    $json$[
      {"title": "KFIP Toss 특별상 수상", "description": "Toss 특별상"},
      {"title": "Toss PoC 협의 단계 진입"},
      {"title": "BKL 법률 검토 단계 진입"}
    ]$json$::jsonb,
    $json$[
      {"body": "기존 법인 KYC는 법인 정보와 각종 증빙서류를 제출하고 심사기관이 이를 반복적으로 검토하는 과정이 필요합니다."},
      {"body": "기관마다 동일하거나 유사한 법인 정보를 다시 확인해야 하며, 검증 완료된 결과를 다른 기관에서 그대로 활용하기 어렵다는 문제가 있습니다."},
      {"body": "KYvC는 법인 KYC 신청과 제출서류 검토를 디지털화하고, 검증이 완료된 법인 정보를 Verifiable Credential 형태로 발급하여 이후 필요한 기관에서 Verifiable Presentation 방식으로 제출·검증할 수 있도록 하는 것을 목표로 했습니다."}
    ]$json$::jsonb,
    $json$[
      {"title": "법인 KYC 신청·서류 제출"},
      {"title": "AI·관리자 KYC 심사"},
      {"title": "VC 발급"},
      {"title": "Wallet Credential 저장"},
      {"title": "VP 제출·검증"},
      {"title": "DID·Credential 상태 관리"}
    ]$json$::jsonb,
    $json$[
      {
        "title": "PL",
        "items": [
          "프로젝트 전체 Flow와 기술 구조 정리",
          "개발 방향 및 Architecture 결정",
          "개발 일정과 작업 분배 조율",
          "서비스 간 연동 구조 검토"
        ]
      },
      {
        "title": "Backend",
        "items": [
          "법인 사용자 업무 API와 KYC 업무 흐름 설계·구현",
          "법인, 사용자, KYC, 제출문서, Credential 관련 데이터 처리",
          "Core 서비스와 업무 Backend 간 연동 구조 구성",
          "관리자 심사 업무와 사용자 업무 데이터 흐름 구성",
          "Database Schema 및 Migration 관리"
        ]
      },
      {
        "title": "Infra",
        "items": [
          "DEV / PROD 실행환경 분리",
          "Docker / Docker Compose 기반 서비스 구성",
          "Nginx 및 Reverse Proxy 요청 구조 구성",
          "GitHub Actions 기반 CI/CD 구성",
          "GHCR Image 배포",
          "Self-hosted Runner 기반 서버 배포 흐름 구성",
          "서비스별 Environment와 Database 분리"
        ]
      }
    ]$json$::jsonb,
    $json$ {
      "notes": [
        {
          "title": "인프라 / 실행 환경",
          "body": "Synology DSM Reverse Proxy → Nginx → Docker / Docker Compose"
        },
        {
          "title": "인프라 / 배포",
          "body": "GitHub Actions → GHCR → Self-hosted Runner → Docker / Docker Compose"
        }
      ]
    }$json$::jsonb,
    'projects/' || project.id || '/architecture/b2051589-7615-4bc8-aec5-f48f6ec84653.png',
    $json$[
      {
        "title": "업무 서비스와 Core 기술 서비스의 책임 분리",
        "summary": "KYC 업무 로직과 DID·VC·VP·AI 기술 기능을 분리해 서비스 간 책임과 변경 범위를 명확하게 구성",
        "problem": "KYC 업무 처리와 DID, VC, VP, XRPL, AI 평가 같은 기술 기능이 하나의 서비스에 강하게 결합되면 업무 기능 변경과 기술 Provider 변경이 서로 영향을 주고 서비스 책임이 불명확해질 수 있었습니다.",
        "solution": "사용자 업무 Backend와 Core 기술 서비스를 분리하고 Backend가 필요한 기술 처리만 Core에 요청하도록 책임을 나눴습니다. 관리자 업무 API와 Core 운영 API 역시 별도로 구분하고 관리자 업무 Backend가 Core를 직접 호출하지 않도록 데이터 책임을 분리했습니다.",
        "result": "사용자 업무, 관리자 업무, Core 기술 기능의 변경 범위를 분리하고 서비스 간 통신 경계를 명확하게 구성했습니다. DID·VC·VP·AI 처리 방식이 변경되더라도 업무 Backend에 미치는 영향을 줄일 수 있는 구조를 확보했습니다."
      },
      {
        "title": "DEV / PROD Database 및 실행환경 분리",
        "summary": "개발과 운영 환경의 Container, Database, 설정을 분리해 환경 간 영향 범위를 차단",
        "problem": "DEV와 PROD가 동일한 Database 또는 실행 설정을 공유하면 개발 중 변경이 운영 데이터에 영향을 줄 수 있고 배포 환경별 설정 관리가 불명확해질 수 있었습니다.",
        "solution": "DEV와 PROD의 Docker Compose, Environment, Database, Network를 환경별로 분리하고 각 환경이 독립적인 Database와 Container 구성을 사용하도록 정리했습니다.",
        "result": "개발 검증과 운영 환경을 분리해 데이터 오염 가능성을 줄이고 환경별 배포와 장애 대응이 독립적으로 가능하도록 구성했습니다."
      },
      {
        "title": "다중 서비스 CI/CD 배포 구조 구성",
        "summary": "Frontend, Backend, Core 등 여러 서비스를 GitHub Actions와 GHCR 기반 이미지 배포 흐름으로 통합",
        "problem": "사용자 Frontend, 관리자 Frontend, Backend, Backend Admin, Core 등 여러 서비스가 존재하여 서버에서 서비스별 Source를 직접 관리하거나 수동 배포할 경우 배포 절차가 복잡해지고 버전 정합성을 유지하기 어려웠습니다.",
        "solution": "GitHub Actions에서 Branch 기준으로 각 서비스 Image를 Build하고 GHCR에 Push한 뒤 Self-hosted Runner와 Docker Compose를 이용해 서버에서 배포하도록 구성했습니다. develop은 DEV, main은 PROD 배포 기준으로 분리했습니다.",
        "result": "서버에서 직접 Application을 Build하지 않고 동일한 Image 기반으로 환경별 배포 흐름을 관리할 수 있게 되었으며 서비스별 배포 기준과 버전 관리가 명확해졌습니다."
      },
      {
        "title": "KYC와 Credential 전체 Flow의 데이터 연결",
        "summary": "법인 KYC 결과가 VC 발급과 VP 검증까지 이어질 수 있도록 업무 데이터와 Credential 상태 흐름을 연결",
        "problem": "KYC 심사 결과, VC 발급 상태, Wallet 수락, VP 제출 및 검증 결과가 서로 다른 서비스와 단계에서 처리되기 때문에 상태 연결이 불명확하면 사용자에게 일관된 진행 상태를 제공하기 어렵습니다.",
        "solution": "업무 Backend를 중심으로 법인과 KYC 상태를 관리하고 Credential 관련 기술 처리는 Core에서 처리하도록 분리하면서 필요한 상태만 업무 영역에 연결하도록 구성했습니다.",
        "result": "법인 KYC 신청부터 심사, VC 발급, Wallet 활용, VP 제출·검증까지 이어지는 End-to-End Flow를 하나의 서비스 경험으로 연결할 수 있게 했습니다."
      }
    ]$json$::jsonb
FROM projects AS project
WHERE project.slug = 'kyvc';

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
