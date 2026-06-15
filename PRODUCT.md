# Product

## Register

product

## Users

AgentClave is for engineering managers, tech leads, senior/staff engineers, and startup CTOs who want AI help on operational engineering workflows without giving agents uncontrolled access to production tools. Their working context is an authenticated dashboard used during repository setup, issue triage review, run inspection, policy review, and audit investigation.

The primary job is to make AI-generated GitHub issue triage safe enough to operate: see what the agent saw, understand what it proposed, route risky actions through human review, execute only approved actions, and keep a durable record of every decision.

## Product Purpose

AgentClave is a human-in-the-loop AI agent control plane. The MVP starts with GitHub issue triage: it receives signed issue webhooks, creates agent runs, validates structured model output, converts output into proposed GitHub actions, evaluates policy, routes actions to approvals, executes approved labels and comments through GitHub, and records traces, audit logs, cost, latency, and evaluation metrics.

Success means a team can trust the system boundary: model output never mutates GitHub directly, every external action is represented as a governed proposal, and reviewers can inspect, approve, reject, edit, and audit the workflow end to end.

## Brand Personality

Controlled, transparent, precise.

AgentClave should feel like a serious operator control plane: calm under pressure, explicit about risk, clear about provenance, and dense enough for technical users. The voice should be direct and specific, favoring labels, statuses, timestamps, reasons, and audit evidence over marketing language.

## Anti-references

AgentClave should not look or behave like an autonomous coding agent, a multi-agent workflow playground, a generic AI chatbot, or a decorative SaaS landing page. Avoid opaque automation, magical AI claims, visual workflow-builder metaphors, glassy marketing surfaces, oversized hero metrics, generic gradient accents, and UI that hides failure or policy-denied states.

## Design Principles

1. Preserve human control at every mutation boundary.
2. Show provenance before confidence: input, model output, policy decision, reviewer action, and executor result must be inspectable.
3. Make risk legible with explicit states, reasons, and audit trails rather than decorative severity colors.
4. Optimize for operational scanning: dense tables, concise cards, stable navigation, and predictable controls.
5. Keep AI subordinate to governance; the product is the control plane, not the agent.

## Accessibility & Inclusion

Target WCAG 2.2 AA. Product UI must support keyboard operation, visible focus states, sufficient text and placeholder contrast, reduced-motion preferences, semantic labels for controls, and non-color-only status communication. Future project-specific accommodations are not yet known.
