-- ============================================================================
-- KLAM.ONLINE - Initial Database Schema
-- Schema: klamonline
-- Engine: InnoDB (MySQL 8+)
-- Character Set: utf8mb4
-- ============================================================================

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Создание схемы, если не существует
CREATE SCHEMA IF NOT EXISTS klamonline DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE klamonline;

-- =========================
-- 1. ЛОГИНЯЩИЕСЯ ПОЛЬЗОВАТЕЛИ
-- =========================

CREATE TABLE users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    telegram_id BIGINT UNSIGNED NOT NULL,
    telegram_username VARCHAR(255) NULL,
    first_name VARCHAR(255) NULL,
    last_name VARCHAR(255) NULL,
    email VARCHAR(255) NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_users_telegram_id (telegram_id),
    KEY idx_users_telegram_username (telegram_username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Пользователи системы (логин через Telegram)';

CREATE TABLE auth_sessions (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NOT NULL,
    ip VARCHAR(45) NULL,
    user_agent VARCHAR(512) NULL,
    KEY idx_auth_sessions_user_id (user_id),
    KEY idx_auth_sessions_expires_at (expires_at),
    CONSTRAINT fk_auth_sessions_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Активные сессии пользователей';


-- =========================
-- 2. КОМПАНИИ И СВЯЗИ
-- =========================

CREATE TABLE companies (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_by_user_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_companies_created_by_user
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Компании (tenant)';

CREATE TABLE company_users (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NOT NULL,
    role_in_company ENUM('owner','admin','member') NOT NULL,
    invited_by_user_id BIGINT UNSIGNED NULL,
    invited_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_company_users_company_user (company_id, user_id),
    KEY idx_company_users_company_id (company_id),
    KEY idx_company_users_user_id (user_id),
    CONSTRAINT fk_company_users_company
        FOREIGN KEY (company_id) REFERENCES companies(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_company_users_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_company_users_invited_by
        FOREIGN KEY (invited_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Связь пользователей с компаниями';

CREATE TABLE company_invitations (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    invited_by_user_id BIGINT UNSIGNED NULL,
    role_in_company ENUM('admin','member') NOT NULL,
    token VARCHAR(255) NOT NULL,
    email VARCHAR(255) NULL,
    telegram_username VARCHAR(255) NULL,
    status ENUM('pending','accepted','cancelled','expired') NOT NULL DEFAULT 'pending',
    expires_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_company_invitations_token (token),
    KEY idx_company_invitations_company_id (company_id),
    KEY idx_company_invitations_status (status),
    KEY idx_company_invitations_expires_at (expires_at),
    CONSTRAINT fk_company_invitations_company
        FOREIGN KEY (company_id) REFERENCES companies(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_company_invitations_invited_by
        FOREIGN KEY (invited_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Приглашения в компанию';


-- =========================
-- 3. PARTICIPANTS (ИСПОЛНИТЕЛИ / ЗАКАЗЧИКИ)
-- =========================

CREATE TABLE participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    telegram_username VARCHAR(255) NULL,
    telegram_id BIGINT UNSIGNED NULL,
    email VARCHAR(255) NULL,
    role_type ENUM('executor','customer') NOT NULL,
    is_active TINYINT(1) NOT NULL DEFAULT 1,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_participants_company_id (company_id),
    KEY idx_participants_role_type (role_type),
    KEY idx_participants_telegram_id (telegram_id),
    UNIQUE KEY uq_participants_company_telegram (company_id, telegram_id),
    CONSTRAINT fk_participants_company
        FOREIGN KEY (company_id) REFERENCES companies(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Участники проектов (исполнители и заказчики)';


-- =========================
-- 4. СПРАВОЧНИКИ
-- =========================

CREATE TABLE departments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code ENUM('KR','AR','ES','SS','GP','OVVK') NOT NULL,
    name VARCHAR(255) NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    UNIQUE KEY uq_departments_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Отделы компании';

CREATE TABLE album_statuses (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    code ENUM('upload','sent','accepted','pending','remarks','production') NOT NULL,
    name VARCHAR(255) NOT NULL,
    color_hex VARCHAR(16) NULL,
    UNIQUE KEY uq_album_statuses_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Статусы альбомов';


-- =========================
-- 5. ПРОЕКТЫ
-- =========================

CREATE TABLE projects (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL,
    customer_company_name VARCHAR(255) NULL,
    owner_user_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_projects_company_code (company_id, code),
    KEY idx_projects_company_id (company_id),
    KEY idx_projects_owner_user_id (owner_user_id),
    KEY idx_projects_code (code),
    CONSTRAINT fk_projects_company
        FOREIGN KEY (company_id) REFERENCES companies(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_projects_owner_user
        FOREIGN KEY (owner_user_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Проекты компании';

CREATE TABLE project_departments (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    department_id BIGINT UNSIGNED NOT NULL,
    KEY idx_project_departments_project_id (project_id),
    KEY idx_project_departments_department_id (department_id),
    CONSTRAINT fk_project_departments_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_project_departments_department
        FOREIGN KEY (department_id) REFERENCES departments(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Отделы, участвующие в проекте';

CREATE TABLE project_participants (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    participant_id BIGINT UNSIGNED NOT NULL,
    role_project ENUM('member','manager','viewer','admin') NOT NULL,
    added_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_project_participants_project_participant (project_id, participant_id),
    KEY idx_project_participants_project_id (project_id),
    KEY idx_project_participants_participant_id (participant_id),
    CONSTRAINT fk_project_participants_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_project_participants_participant
        FOREIGN KEY (participant_id) REFERENCES participants(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_project_participants_added_by
        FOREIGN KEY (added_by) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Участники проекта';

CREATE TABLE project_channels (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    telegram_chat_id BIGINT NULL,
    telegram_chat_title VARCHAR(255) NULL,
    invite_link VARCHAR(512) NULL,
    added_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_project_channels_project_id (project_id),
    KEY idx_project_channels_telegram_chat_id (telegram_chat_id),
    CONSTRAINT fk_project_channels_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_project_channels_added_by
        FOREIGN KEY (added_by) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Telegram-каналы проектов';


-- =========================
-- 6. АЛЬБОМЫ
-- =========================

CREATE TABLE albums (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    project_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL,
    department_id BIGINT UNSIGNED NOT NULL,
    executor_id BIGINT UNSIGNED NOT NULL,
    customer_id BIGINT UNSIGNED NOT NULL,
    deadline DATE NULL,
    status_id BIGINT UNSIGNED NOT NULL,
    last_status_at DATETIME NULL,
    comment TEXT NULL,
    link VARCHAR(1024) NULL,
    telegram_thread_id BIGINT NULL,
    created_by BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_albums_project_code (project_id, code),
    KEY idx_albums_project_id (project_id),
    KEY idx_albums_status_id (status_id),
    KEY idx_albums_deadline (deadline),
    KEY idx_albums_department_id (department_id),
    KEY idx_albums_executor_id (executor_id),
    KEY idx_albums_customer_id (customer_id),
    CONSTRAINT fk_albums_project
        FOREIGN KEY (project_id) REFERENCES projects(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_albums_department
        FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_albums_executor
        FOREIGN KEY (executor_id) REFERENCES participants(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_albums_customer
        FOREIGN KEY (customer_id) REFERENCES participants(id)
        ON DELETE RESTRICT,
    CONSTRAINT fk_albums_status
        FOREIGN KEY (status_id) REFERENCES album_statuses(id),
    CONSTRAINT fk_albums_created_by
        FOREIGN KEY (created_by) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Альбомы проектов';


-- =========================
-- 7. ИСТОРИЯ СТАТУСОВ / СОБЫТИЙ
-- =========================

CREATE TABLE album_events (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    album_id BIGINT UNSIGNED NOT NULL,
    status_id BIGINT UNSIGNED NOT NULL,
    comment TEXT NULL,
    created_by_user_id BIGINT UNSIGNED NULL,
    created_by_participant_id BIGINT UNSIGNED NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    source ENUM('telegram','web','api') NOT NULL,
    telegram_message_id BIGINT NULL,
    KEY idx_album_events_album_id_created_at (album_id, created_at),
    KEY idx_album_events_status_id (status_id),
    KEY idx_album_events_created_by_user_id (created_by_user_id),
    KEY idx_album_events_created_by_participant_id (created_by_participant_id),
    CONSTRAINT fk_album_events_album
        FOREIGN KEY (album_id) REFERENCES albums(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_album_events_status
        FOREIGN KEY (status_id) REFERENCES album_statuses(id),
    CONSTRAINT fk_album_events_created_by_user
        FOREIGN KEY (created_by_user_id) REFERENCES users(id)
        ON DELETE SET NULL,
    CONSTRAINT fk_album_events_created_by_participant
        FOREIGN KEY (created_by_participant_id) REFERENCES participants(id)
        ON DELETE SET NULL,
    CONSTRAINT chk_album_events_author
        CHECK (
            (created_by_user_id IS NOT NULL AND created_by_participant_id IS NULL)
            OR
            (created_by_user_id IS NULL AND created_by_participant_id IS NOT NULL)
        )
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='История изменений статусов альбомов';


-- =========================
-- 8. ШАБЛОНЫ АЛЬБОМОВ
-- =========================

CREATE TABLE album_templates (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    name VARCHAR(255) NOT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_album_templates_company_name (company_id, name),
    KEY idx_album_templates_company_id (company_id),
    KEY idx_album_templates_user_id (user_id),
    CONSTRAINT fk_album_templates_company
        FOREIGN KEY (company_id) REFERENCES companies(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_album_templates_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Шаблоны альбомов';

CREATE TABLE album_template_items (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    template_id BIGINT UNSIGNED NOT NULL,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(255) NOT NULL,
    department_id BIGINT UNSIGNED NOT NULL,
    default_status_id BIGINT UNSIGNED NULL,
    default_deadline_days INT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    KEY idx_album_template_items_template_id (template_id),
    CONSTRAINT fk_album_template_items_template
        FOREIGN KEY (template_id) REFERENCES album_templates(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_album_template_items_department
        FOREIGN KEY (department_id) REFERENCES departments(id),
    CONSTRAINT fk_album_template_items_default_status
        FOREIGN KEY (default_status_id) REFERENCES album_statuses(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Элементы шаблонов альбомов';


-- =========================
-- 9. УВЕДОМЛЕНИЯ И ПОЧТА
-- =========================

CREATE TABLE notification_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT UNSIGNED NOT NULL,
    channel_telegram TINYINT(1) NOT NULL DEFAULT 1,
    channel_email TINYINT(1) NOT NULL DEFAULT 0,
    digest_daily TINYINT(1) NOT NULL DEFAULT 0,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_notification_settings_user_id (user_id),
    CONSTRAINT fk_notification_settings_user
        FOREIGN KEY (user_id) REFERENCES users(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Настройки уведомлений пользователей';

CREATE TABLE email_settings (
    id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    company_id BIGINT UNSIGNED NOT NULL,
    smtp_host VARCHAR(255) NOT NULL,
    smtp_port INT NOT NULL,
    smtp_user VARCHAR(255) NOT NULL,
    smtp_from VARCHAR(255) NOT NULL,
    is_tls TINYINT(1) NOT NULL DEFAULT 1,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_email_settings_company_id (company_id),
    CONSTRAINT fk_email_settings_company
        FOREIGN KEY (company_id) REFERENCES companies(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Настройки почты для компании';

SET FOREIGN_KEY_CHECKS = 1;

-- =========================
-- КОНЕЦ СХЕМЫ
-- =========================
