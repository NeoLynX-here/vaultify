-- ============================================================
-- 🔥 VAULTIFY — FULL UPDATED DATABASE SCHEMA
-- PostgreSQL setup including premium, cards, and 2FA support
-- ============================================================

-- OPTIONAL: Reset database (remove if using in production)
DROP DATABASE IF EXISTS vaultify;
DROP ROLE IF EXISTS vaultuser;

-- ------------------------------------------------------------
-- 1️⃣ Create vault user / role
-- ------------------------------------------------------------
CREATE ROLE vaultuser WITH
    LOGIN
    PASSWORD 'vaultpass'
    CREATEDB;

-- ------------------------------------------------------------
-- 2️⃣ Create database
-- ------------------------------------------------------------
CREATE DATABASE vaultify
    OWNER vaultuser
    ENCODING 'UTF8'
    LC_COLLATE='en_US.UTF-8'
    LC_CTYPE='en_US.UTF-8'
    TEMPLATE template0;

-- ------------------------------------------------------------
-- 3️⃣ Connect to DB
-- ------------------------------------------------------------
\connect vaultify;

-- ------------------------------------------------------------
-- 4️⃣ USERS TABLE (Updated to your new schema)
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    auth_hash TEXT NOT NULL,
    salt TEXT NOT NULL,

    -- Encrypted vault blobs
    encrypted_blob JSONB,
    cards_blob JSONB,

    -- Premium fields
    premium_key TEXT,
    is_premium BOOLEAN DEFAULT FALSE,

    -- 2FA fields
    twofa_enabled BOOLEAN DEFAULT FALSE,
    twofa_secret TEXT
);

-- Unique index already exists but we ensure idempotency:
CREATE UNIQUE INDEX IF NOT EXISTS users_email_key ON users (email);

-- ------------------------------------------------------------
-- 5️⃣ TWOFA TICKETS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS twofa_tickets (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    ticket VARCHAR(64) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Ticket index optimisations
CREATE INDEX IF NOT EXISTS idx_twofa_tickets_ticket ON twofa_tickets(ticket);
CREATE INDEX IF NOT EXISTS idx_twofa_tickets_expires ON twofa_tickets(expires_at);

-- ------------------------------------------------------------
-- 6️⃣ Set ownership and permissions
-- ------------------------------------------------------------
ALTER TABLE users OWNER TO vaultuser;
ALTER TABLE twofa_tickets OWNER TO vaultuser;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO vaultuser;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO vaultuser;

-- ------------------------------------------------------------
-- 7️⃣ Done
-- ------------------------------------------------------------
COMMIT;

-- 💡 Useful commands:
-- \du             - list roles
-- \c vaultify     - connect to DB
-- \dt             - list tables
-- \d users        - describe users table
-- SELECT * FROM users;
