-- Phase 1 Domain Cutover Migration
-- Replaces starter enum values with PRD namespace action types and statuses,
-- reshapes agent_runs / proposed_actions / audit_logs, and adds four new tables.

-- ── New enum types (final values) ─────────────────────────────

-- action_type: replace starter values with github.* namespace
ALTER TABLE proposed_actions DROP CONSTRAINT IF EXISTS proposed_actions_action_type_check;
ALTER TABLE policy_rules DROP CONSTRAINT IF EXISTS policy_rules_action_type_check;

DROP TYPE IF EXISTS action_type_new;
CREATE TYPE action_type_new AS ENUM ('github.add_label', 'github.post_comment');
ALTER TABLE proposed_actions ALTER COLUMN action_type TYPE action_type_new USING action_type::text::action_type_new;
ALTER TABLE policy_rules ALTER COLUMN action_type TYPE action_type_new USING action_type::text::action_type_new;
ALTER TYPE action_type RENAME TO action_type_old;
ALTER TYPE action_type_new RENAME TO action_type;
DROP TYPE action_type_old;

-- action_status: replace starter values with PRD statuses
-- First, remove the default value so the type change can proceed
ALTER TABLE proposed_actions ALTER COLUMN status DROP DEFAULT;

DROP TYPE IF EXISTS action_status_new;
CREATE TYPE action_status_new AS ENUM (
  'pending_policy', 'pending_approval', 'approved', 'rejected',
  'edited', 'executed', 'failed', 'denied_by_policy'
);
ALTER TABLE proposed_actions ALTER COLUMN status TYPE action_status_new USING status::text::action_status_new;
ALTER TABLE proposed_actions ALTER COLUMN status SET DEFAULT 'pending_policy';

-- Drop the old type by first dropping all dependents
ALTER TYPE action_status RENAME TO action_status_old;
ALTER TYPE action_status_new RENAME TO action_status;
DROP TYPE action_status_old CASCADE;

-- approval_status: new enum for approvals and eval reviewer decisions
DROP TYPE IF EXISTS approval_status;
CREATE TYPE approval_status AS ENUM ('approved', 'rejected', 'edited');

-- ── agent_runs: reshape columns ────────────────────────────────

-- Rename trigger_event -> trigger_type
ALTER TABLE agent_runs RENAME COLUMN trigger_event TO trigger_type;

-- Add trigger_source
ALTER TABLE agent_runs ADD COLUMN trigger_source text;

-- Rename trigger_payload -> input_payload
ALTER TABLE agent_runs RENAME COLUMN trigger_payload TO input_payload;

-- Add github_delivery_id
ALTER TABLE agent_runs ADD COLUMN github_delivery_id text;

-- Add normalized_input
ALTER TABLE agent_runs ADD COLUMN normalized_input jsonb;

-- Change confidence from text to real
ALTER TABLE agent_runs ALTER COLUMN confidence TYPE real USING confidence::real;

-- Rename latency_ms -> total_latency_ms
ALTER TABLE agent_runs RENAME COLUMN latency_ms TO total_latency_ms;

-- Rename estimated_cost -> total_cost_cents
ALTER TABLE agent_runs RENAME COLUMN estimated_cost TO total_cost_cents;

-- Add index on github_delivery_id
CREATE INDEX idx_runs_githubDeliveryId ON agent_runs (github_delivery_id);

-- ── proposed_actions: reshape columns ──────────────────────────

-- Rename params -> payload
ALTER TABLE proposed_actions RENAME COLUMN params TO payload;

-- Remove reasoning column
ALTER TABLE proposed_actions DROP COLUMN IF EXISTS reasoning;

-- Add matched_policy_rule_id
ALTER TABLE proposed_actions ADD COLUMN matched_policy_rule_id text
  REFERENCES policy_rules(id) ON DELETE SET NULL;

-- Remove review columns (approvals table is now the source of truth)
ALTER TABLE proposed_actions DROP COLUMN IF EXISTS reviewed_by;
ALTER TABLE proposed_actions DROP COLUMN IF EXISTS reviewed_at;
ALTER TABLE proposed_actions DROP COLUMN IF EXISTS review_comment;

-- ── audit_logs: reshape to actor/target model ──────────────────

-- Remove old columns
ALTER TABLE audit_logs DROP COLUMN IF EXISTS actor_user_id;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS entity_type;
ALTER TABLE audit_logs DROP COLUMN IF EXISTS entity_id;

-- Add new columns
ALTER TABLE audit_logs ADD COLUMN actor_type text NOT NULL DEFAULT '';
ALTER TABLE audit_logs ADD COLUMN actor_id text NOT NULL DEFAULT '';
ALTER TABLE audit_logs ADD COLUMN target_type text NOT NULL DEFAULT '';
ALTER TABLE audit_logs ADD COLUMN target_id text NOT NULL DEFAULT '';

-- Change metadata from text to jsonb
ALTER TABLE audit_logs ALTER COLUMN metadata TYPE jsonb USING metadata::jsonb;

-- Remove defaults after migration
ALTER TABLE audit_logs ALTER COLUMN actor_type DROP DEFAULT;
ALTER TABLE audit_logs ALTER COLUMN actor_id DROP DEFAULT;
ALTER TABLE audit_logs ALTER COLUMN target_type DROP DEFAULT;
ALTER TABLE audit_logs ALTER COLUMN target_id DROP DEFAULT;

-- ── New tables ────────────────────────────────────────────────

-- github_webhook_deliveries
CREATE TABLE github_webhook_deliveries (
  id text PRIMARY KEY,
  organization_id text NOT NULL,
  repository_id text REFERENCES repositories(id) ON DELETE SET NULL,
  run_id text REFERENCES agent_runs(id) ON DELETE SET NULL,
  github_delivery_id text NOT NULL,
  event_type text NOT NULL,
  event_action text,
  payload jsonb NOT NULL,
  received_at timestamp NOT NULL DEFAULT now(),
  processed_at timestamp
);

CREATE UNIQUE INDEX github_webhook_deliveries_delivery_unique ON github_webhook_deliveries (github_delivery_id);
CREATE INDEX github_webhook_deliveries_org_idx ON github_webhook_deliveries (organization_id);
CREATE INDEX github_webhook_deliveries_run_idx ON github_webhook_deliveries (run_id);

-- agent_run_steps
CREATE TABLE agent_run_steps (
  id text PRIMARY KEY,
  run_id text NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  step_index integer NOT NULL,
  type text NOT NULL,
  status text NOT NULL,
  input_metadata jsonb,
  output_metadata jsonb,
  error_metadata jsonb,
  cost_cents integer,
  latency_ms integer,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX agent_run_steps_run_step_unique ON agent_run_steps (run_id, step_index);
CREATE INDEX agent_run_steps_run_idx ON agent_run_steps (run_id);

-- approvals
CREATE TABLE approvals (
  id text PRIMARY KEY,
  proposed_action_id text NOT NULL REFERENCES proposed_actions(id) ON DELETE CASCADE,
  reviewer_user_id text NOT NULL,
  status approval_status NOT NULL,
  original_payload jsonb NOT NULL,
  edited_payload jsonb,
  rejection_reason text,
  reviewer_note text,
  created_at timestamp NOT NULL DEFAULT now(),
  decided_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX approvals_action_idx ON approvals (proposed_action_id);
CREATE INDEX approvals_reviewer_idx ON approvals (reviewer_user_id);

-- eval_samples
CREATE TABLE eval_samples (
  id text PRIMARY KEY,
  run_id text NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
  proposed_action_id text NOT NULL REFERENCES proposed_actions(id) ON DELETE CASCADE,
  reviewer_decision approval_status NOT NULL,
  original_agent_output jsonb NOT NULL,
  final_payload jsonb NOT NULL,
  rejection_reason text,
  reviewer_note text,
  created_at timestamp NOT NULL DEFAULT now()
);

CREATE INDEX eval_samples_run_idx ON eval_samples (run_id);
CREATE INDEX eval_samples_action_idx ON eval_samples (proposed_action_id);
