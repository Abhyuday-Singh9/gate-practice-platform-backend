```sql
-- =====================================================
-- GATE Practice Platform Database Schema (PostgreSQL)
-- =====================================================

-- =========================
-- 1. BRANCHES
-- =========================

CREATE TABLE branches (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL
);

-- =========================
-- 2. SUBJECTS
-- =========================

CREATE TABLE subjects (
    id BIGSERIAL PRIMARY KEY,
    branch_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    CONSTRAINT fk_subject_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(id)
        ON DELETE CASCADE
);

-- =========================
-- 3. TOPICS
-- =========================

CREATE TABLE topics (
    id BIGSERIAL PRIMARY KEY,
    subject_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,

    CONSTRAINT fk_topic_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id)
        ON DELETE CASCADE
);

-- =========================
-- 4. USERS
-- =========================

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,

    email VARCHAR(255) NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    branch_id BIGINT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user_branch
        FOREIGN KEY (branch_id)
        REFERENCES branches(id)
);

-- =========================
-- 5. QUESTIONS
-- =========================

CREATE TABLE questions (
    id BIGSERIAL PRIMARY KEY,

    subject_id BIGINT NOT NULL,

    topic_id BIGINT NOT NULL,

    question_type VARCHAR(20) NOT NULL,

    difficulty VARCHAR(20),

    marks DECIMAL(5,2) DEFAULT 1,

    negative_marks DECIMAL(5,2) DEFAULT 0,

    question_text TEXT NOT NULL,

    explanation TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_question_subject
        FOREIGN KEY (subject_id)
        REFERENCES subjects(id),

    CONSTRAINT fk_question_topic
        FOREIGN KEY (topic_id)
        REFERENCES topics(id)
);

-- =========================
-- 6. QUESTION OPTIONS
-- =========================

CREATE TABLE question_options (
    id BIGSERIAL PRIMARY KEY,

    question_id BIGINT NOT NULL,

    option_text TEXT NOT NULL,

    is_correct BOOLEAN DEFAULT FALSE,

    CONSTRAINT fk_option_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE
);

-- =========================
-- 7. TAGS
-- =========================

CREATE TABLE tags (
    id BIGSERIAL PRIMARY KEY,

    name VARCHAR(50) UNIQUE NOT NULL
);

-- =========================
-- 8. QUESTION TAGS
-- =========================

CREATE TABLE question_tags (
    question_id BIGINT NOT NULL,

    tag_id BIGINT NOT NULL,

    PRIMARY KEY (question_id, tag_id),

    CONSTRAINT fk_qtag_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_qtag_tag
        FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);

-- =========================
-- 9. TESTS
-- =========================

CREATE TABLE tests (
    id BIGSERIAL PRIMARY KEY,

    title VARCHAR(255) NOT NULL,

    description TEXT,

    test_type VARCHAR(30) NOT NULL,

    duration_minutes INTEGER NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =========================
-- 10. TEST QUESTIONS
-- =========================

CREATE TABLE test_questions (
    test_id BIGINT NOT NULL,

    question_id BIGINT NOT NULL,

    question_order INTEGER NOT NULL,

    PRIMARY KEY (test_id, question_id),

    CONSTRAINT fk_test_question_test
        FOREIGN KEY (test_id)
        REFERENCES tests(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_test_question_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE
);

-- =========================
-- 11. TEST ATTEMPTS
-- =========================

CREATE TABLE test_attempts (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    test_id BIGINT NOT NULL,

    started_at TIMESTAMP,

    submitted_at TIMESTAMP,

    score DECIMAL(10,2),

    accuracy DECIMAL(5,2),

    status VARCHAR(20) NOT NULL,

    CONSTRAINT fk_attempt_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_attempt_test
        FOREIGN KEY (test_id)
        REFERENCES tests(id)
);

-- =========================
-- 12. ATTEMPT ANSWERS
-- =========================

CREATE TABLE attempt_answers (
    id BIGSERIAL PRIMARY KEY,

    attempt_id BIGINT NOT NULL,

    question_id BIGINT NOT NULL,

    selected_answer TEXT,

    is_correct BOOLEAN,

    time_spent_seconds INTEGER DEFAULT 0,

    answered_at TIMESTAMP,

    CONSTRAINT fk_answer_attempt
        FOREIGN KEY (attempt_id)
        REFERENCES test_attempts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_answer_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
);

-- =========================
-- 13. USER QUESTION STATUS
-- =========================

CREATE TABLE user_question_status (
    user_id BIGINT NOT NULL,

    question_id BIGINT NOT NULL,

    status VARCHAR(30) NOT NULL,

    attempt_count INTEGER DEFAULT 0,

    correct_count INTEGER DEFAULT 0,

    incorrect_count INTEGER DEFAULT 0,

    last_attempted_at TIMESTAMP,

    PRIMARY KEY (user_id, question_id),

    CONSTRAINT fk_uqs_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_uqs_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE
);

-- =========================
-- 14. BOOKMARKS
-- =========================

CREATE TABLE bookmarks (
    user_id BIGINT NOT NULL,

    question_id BIGINT NOT NULL,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, question_id),

    CONSTRAINT fk_bookmark_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_bookmark_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE
);

-- =========================
-- 15. MISTAKE BOOK
-- =========================

CREATE TABLE mistake_book (
    user_id BIGINT NOT NULL,

    question_id BIGINT NOT NULL,

    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, question_id),

    CONSTRAINT fk_mistake_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_mistake_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
        ON DELETE CASCADE
);

-- =========================
-- 16. QUESTION FEEDBACK
-- =========================

CREATE TABLE question_feedback (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    question_id BIGINT NOT NULL,

    rating INTEGER,

    comment TEXT,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_feedback_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_feedback_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
);

-- =========================
-- 17. QUESTION REPORTS
-- =========================

CREATE TABLE question_reports (
    id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,

    question_id BIGINT NOT NULL,

    report_type VARCHAR(50) NOT NULL,

    description TEXT,

    status VARCHAR(20) DEFAULT 'OPEN',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_report_user
        FOREIGN KEY (user_id)
        REFERENCES users(id),

    CONSTRAINT fk_report_question
        FOREIGN KEY (question_id)
        REFERENCES questions(id)
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX idx_questions_subject
ON questions(subject_id);

CREATE INDEX idx_questions_topic
ON questions(topic_id);

CREATE INDEX idx_attempt_answers_question
ON attempt_answers(question_id);

CREATE INDEX idx_attempt_answers_attempt
ON attempt_answers(attempt_id);

CREATE INDEX idx_test_attempts_user
ON test_attempts(user_id);

CREATE INDEX idx_test_attempts_test
ON test_attempts(test_id);

CREATE INDEX idx_bookmarks_user
ON bookmarks(user_id);

CREATE INDEX idx_mistake_book_user
ON mistake_book(user_id);

CREATE INDEX idx_question_reports_status
ON question_reports(status);
```
