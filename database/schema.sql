-- PagaTú - MySQL Schema
-- Migrated from PostgreSQL/Supabase
-- Security is handled at the application layer (Node.js backend), not at DB level

SET NAMES utf8mb4;
SET time_zone = '+00:00';

-- -----------------------------------------------
-- profiles
-- Stores user accounts (registered + temporary)
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS profiles (
  id           CHAR(36)     NOT NULL DEFAULT (UUID()),
  email        VARCHAR(255) NOT NULL,
  name         VARCHAR(255) DEFAULT NULL,
  avatar_url   TEXT         DEFAULT NULL,
  is_temporary TINYINT(1)   NOT NULL DEFAULT 0,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_profiles_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- accounts
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS accounts (
  id           CHAR(36)       NOT NULL DEFAULT (UUID()),
  name         VARCHAR(255)   NOT NULL,
  description  TEXT           DEFAULT NULL,
  owner_id     CHAR(36)       NOT NULL,
  subtotal     DECIMAL(12,2)  NOT NULL DEFAULT 0,
  tip_amount   DECIMAL(12,2)  NOT NULL DEFAULT 0,
  tip_included TINYINT(1)     NOT NULL DEFAULT 0,
  total        DECIMAL(12,2)  NOT NULL DEFAULT 0,
  created_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_accounts_owner_id (owner_id),
  CONSTRAINT fk_accounts_owner FOREIGN KEY (owner_id) REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- account_items
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS account_items (
  id         CHAR(36)      NOT NULL DEFAULT (UUID()),
  account_id CHAR(36)      NOT NULL,
  name       VARCHAR(255)  NOT NULL,
  amount     DECIMAL(12,2) NOT NULL,
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_account_items_account_id (account_id),
  CONSTRAINT fk_items_account FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- account_participants
-- Each row represents a person (registered or guest)
-- in an account. NULLs in participant_id are allowed
-- for guests not yet registered.
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS account_participants (
  id             CHAR(36)      NOT NULL DEFAULT (UUID()),
  account_id     CHAR(36)      NOT NULL,
  participant_id CHAR(36)      DEFAULT NULL,
  email          VARCHAR(255)  NOT NULL,
  name           VARCHAR(255)  DEFAULT NULL,
  is_registered  TINYINT(1)    NOT NULL DEFAULT 0,
  total_amount   DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid           TINYINT(1)    NOT NULL DEFAULT 0,
  created_at     DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  -- One registered profile per account (NULLs are not subject to unique)
  UNIQUE KEY uq_participant_account (account_id, participant_id),
  -- One email per account
  UNIQUE KEY uq_email_account (account_id, email),
  KEY idx_ap_account_id (account_id),
  KEY idx_ap_participant_id (participant_id),
  CONSTRAINT fk_ap_account FOREIGN KEY (account_id)     REFERENCES accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_ap_profile FOREIGN KEY (participant_id) REFERENCES profiles (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- item_participants
-- Many-to-many: account_items ↔ account_participants
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS item_participants (
  id             CHAR(36) NOT NULL DEFAULT (UUID()),
  item_id        CHAR(36) NOT NULL,
  participant_id CHAR(36) NOT NULL,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_item_participant (item_id, participant_id),
  KEY idx_ip_item_id (item_id),
  KEY idx_ip_participant_id (participant_id),
  CONSTRAINT fk_ip_item        FOREIGN KEY (item_id)        REFERENCES account_items        (id) ON DELETE CASCADE,
  CONSTRAINT fk_ip_participant FOREIGN KEY (participant_id) REFERENCES account_participants (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- invitations
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS invitations (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  account_id  CHAR(36)     NOT NULL,
  email       VARCHAR(255) NOT NULL,
  name        VARCHAR(255) DEFAULT NULL,
  invited_by  CHAR(36)     NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'accepted', 'declined')),
  token       VARCHAR(128) NOT NULL,
  expires_at  DATETIME     NOT NULL DEFAULT (DATE_ADD(NOW(), INTERVAL 7 DAY)),
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_invitation_token (token),
  KEY idx_inv_account_id (account_id),
  KEY idx_inv_email (email),
  CONSTRAINT fk_inv_account    FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
  CONSTRAINT fk_inv_invited_by FOREIGN KEY (invited_by) REFERENCES profiles  (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- banking_details
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS banking_details (
  id             CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id        CHAR(36)     NOT NULL,
  bank_name      VARCHAR(100) DEFAULT NULL,
  account_type   VARCHAR(50)  DEFAULT NULL,
  account_number VARCHAR(50)  DEFAULT NULL,
  bank_email     VARCHAR(255) DEFAULT NULL,
  created_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at     DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_banking_user (user_id),
  CONSTRAINT fk_banking_user FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- -----------------------------------------------
-- frequent_contacts
-- -----------------------------------------------
CREATE TABLE IF NOT EXISTS frequent_contacts (
  id          CHAR(36)     NOT NULL DEFAULT (UUID()),
  user_id     CHAR(36)     NOT NULL,
  name        VARCHAR(255) NOT NULL,
  email       VARCHAR(255) NOT NULL,
  usage_count INT          NOT NULL DEFAULT 1,
  last_used_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_contact_user_email (user_id, email),
  KEY idx_fc_user_id (user_id),
  CONSTRAINT fk_fc_user FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
