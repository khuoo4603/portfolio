CREATE TABLE monitoring_settings (
    id SMALLINT NOT NULL DEFAULT 1,
    enabled BOOLEAN NOT NULL,
    check_interval_seconds INTEGER NOT NULL,
    connect_timeout_ms INTEGER NOT NULL,
    request_timeout_ms INTEGER NOT NULL,
    retry_delay_ms INTEGER NOT NULL,
    max_retries INTEGER NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_monitoring_settings PRIMARY KEY (id),
    CONSTRAINT ck_monitoring_settings_singleton CHECK (id = 1),
    CONSTRAINT ck_monitoring_settings_interval CHECK (check_interval_seconds > 0),
    CONSTRAINT ck_monitoring_settings_connect_timeout CHECK (connect_timeout_ms > 0),
    CONSTRAINT ck_monitoring_settings_request_timeout CHECK (request_timeout_ms > 0),
    CONSTRAINT ck_monitoring_settings_retry_delay CHECK (retry_delay_ms >= 0),
    CONSTRAINT ck_monitoring_settings_max_retries CHECK (max_retries >= 0)
);

CREATE TABLE monitoring_targets (
    id BIGSERIAL NOT NULL,
    service_key VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    health_url TEXT,
    enabled BOOLEAN NOT NULL,
    display_order INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_monitoring_targets PRIMARY KEY (id),
    CONSTRAINT uq_monitoring_targets_service_key UNIQUE (service_key),
    CONSTRAINT ck_monitoring_targets_display_order CHECK (display_order >= 0)
);

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
