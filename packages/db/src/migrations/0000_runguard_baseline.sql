-- RunGuard Baseline Migration
-- Creates enums and core business tables for the RunGuard platform.

-- ── Enums ──────────────────────────────────────────────────────

DO $$ BEGIN
    CREATE TYPE run_status AS ENUM ('queued', 'running', 'waiting_for_approval', 'completed', 'failed', 'rejected', 'cancelled');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE action_type AS ENUM ('add_label', 'remove_label', 'post_comment', 'close_issue', 'reopen_issue', 'assign');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE action_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled', 'executed', 'failed');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE policy_decision AS ENUM ('allow', 'require_approval', 'deny');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE agent_status AS ENUM ('active', 'paused');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- ── Organization Settings ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS organization_settings (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    default_agent_id TEXT,
    require_approval_for_labels BOOLEAN NOT NULL DEFAULT true,
    require_approval_for_comments BOOLEAN NOT NULL DEFAULT true,
    max_daily_runs INTEGER NOT NULL DEFAULT 100,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS org_settings_orgId_idx ON organization_settings(organization_id);

-- ── GitHub Installations ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS github_installations (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    installation_id INTEGER NOT NULL,
    account_name TEXT NOT NULL,
    account_type TEXT NOT NULL,
    avatar_url TEXT,
    permissions JSONB,
    suspended_at TIMESTAMP,
    installed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT github_installs_installId_unique UNIQUE (installation_id)
);

CREATE INDEX IF NOT EXISTS github_installs_orgId_idx ON github_installations(organization_id);

-- ── Repositories ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS repositories (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    installation_id TEXT NOT NULL REFERENCES github_installations(id) ON DELETE CASCADE,
    github_repo_id INTEGER NOT NULL,
    full_name TEXT NOT NULL,
    private BOOLEAN NOT NULL,
    default_branch TEXT NOT NULL DEFAULT 'main',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT repos_githubRepoId_unique UNIQUE (github_repo_id)
);

CREATE INDEX IF NOT EXISTS repos_orgId_idx ON repositories(organization_id);
CREATE INDEX IF NOT EXISTS repos_installId_idx ON repositories(installation_id);

-- ── Agents ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agents (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    agent_type TEXT NOT NULL DEFAULT 'github_issue_triage',
    model TEXT NOT NULL DEFAULT 'gpt-4o',
    system_prompt TEXT,
    allowed_labels JSONB DEFAULT '[]',
    risk_level risk_level NOT NULL DEFAULT 'medium',
    daily_budget INTEGER,
    status agent_status NOT NULL DEFAULT 'paused',
    created_by TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS agents_orgId_idx ON agents(organization_id);
CREATE INDEX IF NOT EXISTS agents_status_idx ON agents(status);

-- ── Agent Runs ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS agent_runs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    agent_id TEXT NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
    repository_id TEXT REFERENCES repositories(id) ON DELETE SET NULL,
    status run_status NOT NULL DEFAULT 'queued',
    trigger_event TEXT,
    trigger_payload JSONB,
    issue_title TEXT,
    issue_body TEXT,
    issue_number INTEGER,
    issue_url TEXT,
    agent_output JSONB,
    confidence TEXT,
    policy_decision policy_decision,
    latency_ms INTEGER,
    estimated_cost TEXT,
    error_message TEXT,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS runs_orgId_idx ON agent_runs(organization_id);
CREATE INDEX IF NOT EXISTS runs_agentId_idx ON agent_runs(agent_id);
CREATE INDEX IF NOT EXISTS runs_status_idx ON agent_runs(status);
CREATE INDEX IF NOT EXISTS runs_createdAt_idx ON agent_runs(created_at);

-- ── Proposed Actions ──────────────────────────────────────────

CREATE TABLE IF NOT EXISTS proposed_actions (
    id TEXT PRIMARY KEY,
    run_id TEXT NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
    organization_id TEXT NOT NULL,
    action_type action_type NOT NULL,
    params JSONB NOT NULL DEFAULT '{}',
    reasoning TEXT,
    risk_level risk_level NOT NULL DEFAULT 'medium',
    status action_status NOT NULL DEFAULT 'pending',
    policy_decision policy_decision,
    reviewed_by TEXT,
    reviewed_at TIMESTAMP,
    review_comment TEXT,
    executed_at TIMESTAMP,
    execution_result JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS actions_runId_idx ON proposed_actions(run_id);
CREATE INDEX IF NOT EXISTS actions_orgId_idx ON proposed_actions(organization_id);
CREATE INDEX IF NOT EXISTS actions_status_idx ON proposed_actions(status);

-- ── Policy Rules ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS policy_rules (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    action_type action_type,
    risk_level_min risk_level,
    condition TEXT,
    decision policy_decision NOT NULL,
    priority INTEGER NOT NULL DEFAULT 0,
    enabled BOOLEAN NOT NULL DEFAULT true,
    created_by TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS policy_rules_orgId_idx ON policy_rules(organization_id);
CREATE INDEX IF NOT EXISTS policy_rules_enabled_idx ON policy_rules(enabled);

-- ── Audit Logs ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_logs (
    id TEXT PRIMARY KEY,
    organization_id TEXT NOT NULL,
    actor_user_id TEXT NOT NULL,
    run_id TEXT REFERENCES agent_runs(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL,
    metadata TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS audit_logs_orgId_idx ON audit_logs(organization_id);
