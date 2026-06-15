-- Add Better Auth tables that were previously created at runtime.
-- These tables are required by Better Auth's Drizzle adapter.

-- ── User ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "user" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "email" text NOT NULL UNIQUE,
    "email_verified" boolean NOT NULL DEFAULT false,
    "image" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ── Session ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "session" (
    "id" text PRIMARY KEY,
    "expires_at" timestamp NOT NULL,
    "token" text NOT NULL UNIQUE,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now(),
    "ip_address" text,
    "user_agent" text,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "active_organization_id" text,
    "active_team_id" text
);

CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session" ("user_id");

-- ── Account ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "account" (
    "id" text PRIMARY KEY,
    "account_id" text NOT NULL,
    "provider_id" text NOT NULL,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "access_token" text,
    "refresh_token" text,
    "id_token" text,
    "access_token_expires_at" timestamp,
    "refresh_token_expires_at" timestamp,
    "scope" text,
    "password" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "account_userId_idx" ON "account" ("user_id");

-- ── Verification ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "verification" (
    "id" text PRIMARY KEY,
    "identifier" text NOT NULL,
    "value" text NOT NULL,
    "expires_at" timestamp NOT NULL,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "verification_identifier_idx" ON "verification" ("identifier");

-- ── Organization ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "organization" (
    "id" text PRIMARY KEY,
    "name" text NOT NULL,
    "slug" text NOT NULL UNIQUE,
    "logo" text,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "updated_at" timestamp NOT NULL DEFAULT now()
);

-- ── Member ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "member" (
    "id" text PRIMARY KEY,
    "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
    "user_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE,
    "role" text NOT NULL DEFAULT 'member',
    "created_at" timestamp NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "member_organizationId_idx" ON "member" ("organization_id");
CREATE INDEX IF NOT EXISTS "member_userId_idx" ON "member" ("user_id");

-- ── Invitation ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS "invitation" (
    "id" text PRIMARY KEY,
    "organization_id" text NOT NULL REFERENCES "organization"("id") ON DELETE CASCADE,
    "email" text NOT NULL,
    "role" text,
    "status" text NOT NULL DEFAULT 'pending',
    "expires_at" timestamp,
    "created_at" timestamp NOT NULL DEFAULT now(),
    "inviter_id" text NOT NULL REFERENCES "user"("id") ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "invitation_organizationId_idx" ON "invitation" ("organization_id");
CREATE INDEX IF NOT EXISTS "invitation_email_idx" ON "invitation" ("email");
