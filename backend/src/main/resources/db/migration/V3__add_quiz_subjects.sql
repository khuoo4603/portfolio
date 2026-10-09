CREATE TABLE tool_quiz_subjects (
    id BIGSERIAL NOT NULL,
    account_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT pk_tool_quiz_subjects PRIMARY KEY (id),
    CONSTRAINT uq_tool_quiz_subjects_account_name UNIQUE (account_id, name)
);

ALTER TABLE tool_quizzes ADD COLUMN subject_id BIGINT;

ALTER TABLE tool_quizzes
    ADD CONSTRAINT fk_tool_quizzes_subject
        FOREIGN KEY (subject_id) REFERENCES tool_quiz_subjects (id) ON DELETE SET NULL;
