-- 사용자 계정 테이블
CREATE TABLE accounts (
    id BIGSERIAL NOT NULL,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_accounts PRIMARY KEY (id),
    CONSTRAINT uq_accounts_email UNIQUE (email)
);

-- 이메일 인증 및 관리자 재인증 Challenge 테이블
CREATE TABLE verification_challenges (
    id UUID NOT NULL,
    account_id BIGINT NOT NULL,
    purpose VARCHAR(30) NOT NULL,
    operation VARCHAR(60),
    target_type VARCHAR(30),
    target_id VARCHAR(100),
    code_hash VARCHAR(255) NOT NULL,
    remember_me BOOLEAN NOT NULL DEFAULT FALSE,
    failed_attempts SMALLINT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_verification_challenges PRIMARY KEY (id)
);

CREATE INDEX idx_verification_account_purpose_created
    ON verification_challenges (account_id, purpose, created_at);

-- 로그인 성공·실패 기록 테이블
CREATE TABLE login_logs (
    id BIGSERIAL NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    account_id BIGINT,
    email VARCHAR(255) NOT NULL,
    event_type VARCHAR(40) NOT NULL,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    ip_address VARCHAR(45) NOT NULL,
    user_agent TEXT,
    browser VARCHAR(100),
    operating_system VARCHAR(100),
    device VARCHAR(50),
    trace_id VARCHAR(64) NOT NULL,
    CONSTRAINT pk_login_logs PRIMARY KEY (id)
);

CREATE INDEX idx_login_logs_occurred_at ON login_logs (occurred_at);
CREATE INDEX idx_login_logs_email_occurred ON login_logs (email, occurred_at);
CREATE INDEX idx_login_logs_ip_occurred ON login_logs (ip_address, occurred_at);

-- 포트폴리오 고정 콘텐츠 테이블
CREATE TABLE portfolio_contents (
    id BIGSERIAL NOT NULL,
    category VARCHAR(50) NOT NULL,
    content_code VARCHAR(100) NOT NULL,
    content_value TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_portfolio_contents PRIMARY KEY (id),
    CONSTRAINT uq_portfolio_contents_category_code UNIQUE (category, content_code)
);

-- 학력·경력·활동·수상·자격·교육 프로필 항목 테이블
CREATE TABLE profile_entries (
    id BIGSERIAL NOT NULL,
    entry_type VARCHAR(30) NOT NULL,
    period_text VARCHAR(100),
    title VARCHAR(200) NOT NULL,
    organization VARCHAR(200),
    role VARCHAR(200),
    description TEXT,
    achievement TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_profile_entries PRIMARY KEY (id)
);

-- 이력서 파일 메타데이터 테이블
CREATE TABLE resume_files (
    id SMALLINT NOT NULL DEFAULT 1,
    original_name VARCHAR(255) NOT NULL,
    storage_key VARCHAR(255) NOT NULL,
    size_bytes BIGINT NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_resume_files PRIMARY KEY (id)
);

-- 기술 스택 마스터 테이블
CREATE TABLE technology_master (
    id BIGSERIAL NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(50) NOT NULL,
    icon_url TEXT,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_technology_master PRIMARY KEY (id),
    CONSTRAINT uq_technology_master_name UNIQUE (name)
);

-- 포트폴리오 메인 기술 연결 테이블
CREATE TABLE portfolio_technologies (
    technology_id BIGINT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT pk_portfolio_technologies PRIMARY KEY (technology_id),
    CONSTRAINT fk_portfolio_technologies_technology
        FOREIGN KEY (technology_id) REFERENCES technology_master (id) ON DELETE CASCADE
);

-- 프로젝트 기본정보 테이블
CREATE TABLE projects (
    id BIGSERIAL NOT NULL,
    slug VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    year SMALLINT NOT NULL,
    tagline VARCHAR(300) NOT NULL,
    description TEXT NOT NULL,
    card_role VARCHAR(150) NOT NULL,
    summary TEXT,
    detail_role VARCHAR(200),
    started_at DATE,
    ended_at DATE,
    team_size SMALLINT,
    thumbnail_url TEXT,
    display_order INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_projects PRIMARY KEY (id),
    CONSTRAINT uq_projects_slug UNIQUE (slug)
);

-- 프로젝트 기술 연결 테이블
CREATE TABLE project_technologies (
    project_id BIGINT NOT NULL,
    technology_id BIGINT NOT NULL,
    show_on_card BOOLEAN NOT NULL DEFAULT FALSE,
    highlighted BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT pk_project_technologies PRIMARY KEY (project_id, technology_id),
    CONSTRAINT fk_project_technologies_project
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE,
    CONSTRAINT fk_project_technologies_technology
        FOREIGN KEY (technology_id) REFERENCES technology_master (id) ON DELETE CASCADE
);

-- 프로젝트 상세 콘텐츠 테이블
CREATE TABLE project_contents (
    project_id BIGINT NOT NULL,
    results_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    background_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    features_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    development_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    architecture_json JSONB NOT NULL DEFAULT '{}'::jsonb,
    engineering_json JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_project_contents PRIMARY KEY (project_id),
    CONSTRAINT fk_project_contents_project
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- 프로젝트 이미지 미디어 테이블
CREATE TABLE project_media (
    id BIGSERIAL NOT NULL,
    project_id BIGINT NOT NULL,
    image_url TEXT NOT NULL,
    label VARCHAR(200),
    alt_text VARCHAR(300),
    display_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_project_media PRIMARY KEY (id),
    CONSTRAINT fk_project_media_project
        FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
);

-- 포트폴리오 외부 링크 테이블
CREATE TABLE external_links (
    id BIGSERIAL NOT NULL,
    name VARCHAR(100) NOT NULL,
    url TEXT NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_external_links PRIMARY KEY (id)
);

-- Tool 표시명 및 활성 상태 테이블
CREATE TABLE tools (
    tool_key VARCHAR(100) NOT NULL,
    name VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_tools PRIMARY KEY (tool_key)
);

-- Links Tool 공통 링크 테이블
CREATE TABLE tool_links (
    id BIGSERIAL NOT NULL,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    url TEXT NOT NULL,
    image_storage_key VARCHAR(255),
    category VARCHAR(50) NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_tool_links PRIMARY KEY (id)
);

-- 사용자별 저장 Quiz 테이블
CREATE TABLE tool_quizzes (
    id BIGSERIAL NOT NULL,
    account_id BIGINT NOT NULL,
    title VARCHAR(200) NOT NULL,
    quiz_json JSONB NOT NULL,
    response_json JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_tool_quizzes PRIMARY KEY (id)
);

CREATE INDEX idx_tool_quizzes_account_updated ON tool_quizzes (account_id, updated_at);

-- 일별 방문자 및 페이지 조회 집계 테이블
CREATE TABLE daily_visits (
    id BIGSERIAL NOT NULL,
    visit_date DATE NOT NULL,
    visitor_key UUID NOT NULL,
    page_view_count INTEGER NOT NULL DEFAULT 1,
    first_viewed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_viewed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_daily_visits PRIMARY KEY (id),
    CONSTRAINT uq_daily_visits_date_visitor UNIQUE (visit_date, visitor_key)
);

CREATE INDEX idx_daily_visits_date ON daily_visits (visit_date);

-- 서비스 현재 상태 테이블
CREATE TABLE service_status (
    service_key VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL,
    response_time_ms INTEGER,
    http_status SMALLINT,
    last_checked_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT pk_service_status PRIMARY KEY (service_key)
);

-- HTTP 5xx 오류 요약 테이블
CREATE TABLE error_logs (
    id BIGSERIAL NOT NULL,
    occurred_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    service VARCHAR(30) NOT NULL,
    method VARCHAR(10),
    path VARCHAR(1000),
    status_code SMALLINT NOT NULL,
    error_code VARCHAR(100),
    message VARCHAR(500) NOT NULL,
    trace_id VARCHAR(64) NOT NULL,
    CONSTRAINT pk_error_logs PRIMARY KEY (id)
);

CREATE INDEX idx_error_logs_occurred_at ON error_logs (occurred_at);

-- Spring Session 테이블
CREATE TABLE spring_session (
    primary_id CHAR(36) NOT NULL,
    session_id CHAR(36) NOT NULL,
    creation_time BIGINT NOT NULL,
    last_access_time BIGINT NOT NULL,
    max_inactive_interval INTEGER NOT NULL,
    expiry_time BIGINT NOT NULL,
    principal_name VARCHAR(100),
    CONSTRAINT pk_spring_session PRIMARY KEY (primary_id),
    CONSTRAINT uq_spring_session_id UNIQUE (session_id)
);

CREATE INDEX idx_spring_session_expiry ON spring_session (expiry_time);
CREATE INDEX idx_spring_session_principal ON spring_session (principal_name);

-- Spring Session 속성 테이블
CREATE TABLE spring_session_attributes (
    session_primary_id CHAR(36) NOT NULL,
    attribute_name VARCHAR(200) NOT NULL,
    attribute_bytes BYTEA NOT NULL,
    CONSTRAINT pk_spring_session_attributes PRIMARY KEY (session_primary_id, attribute_name),
    CONSTRAINT fk_session_attributes_session
        FOREIGN KEY (session_primary_id) REFERENCES spring_session (primary_id) ON DELETE CASCADE
);
