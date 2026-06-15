# AGENTS.md

Project session bootstrap and wiring doc.

## Context read order

Read these files in this exact order before implementation:

1. `context/project-overview.md`
2. `context/architecture.md`
3. `context/ui-tokens.md`
4. `context/ui-rules.md`
5. `context/ui-registry.md`
6. `context/code-standards.md`
7. `context/library-docs.md`
8. `context/build-plan.md`
9. `context/progress-tracker.md`

If any file is missing or clearly stale, repair context first before trusting implementation work.

## Workflow rules

- Context first. Then planning. Then building.
- `context/` files are project operating system, not optional notes.
- Prefer existing package boundaries and shared utilities over new abstractions.
- Use token-based styling from `@agentclave/ui`; no hardcoded hex or raw Tailwind palette classes.
- Update `context/progress-tracker.md` after every meaningful feature.
- Update `context/ui-registry.md` after new reusable UI patterns or components.
- Before changing third-party-library-backed code, load installed skill first when available, then check `context/library-docs.md`.
- If same problem persists after one corrective prompt, stop and use `/recover`.
- After every meaningful feature or refactor, run `/syncdocs` to reconcile context files with actual code state.

## Current repo reality

- AgentClave: agentic governed agent runtime for internal operations
- pnpm workspace with Vite+ task runner
- Backend: Hono + oRPC in `apps/api`
- Worker: BullMQ + Redis in `apps/worker`
- Frontend: Vite React dashboard in `apps/web`
- Auth: Better Auth with Organization plugin
- DB: Drizzle ORM + PostgreSQL
- AI: OpenRouter with tool calling for agent runtime
- Runtime: Generic webhook ingress, HTTP executor, policy engine, approval workflow
- Integration: Telegram bot connector, Demo inventory API
- All code under `@agentclave/*` workspace scope

Future sessions should trust `context/` first, then verify older docs before reusing them.
