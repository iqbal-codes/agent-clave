# Library Docs

## Authority order

1. Installed source and package versions in this repository.
2. Official library documentation fetched live through Context7 when available.
3. Official project docs or API references fetched with `read`/web lookup when Context7 does not cover the service.
4. Existing repo patterns and context files.
5. Model memory only as a last resort, never for version-sensitive API syntax.

## Documentation workflow

- Before changing third-party-library-backed code, check this file and load the relevant installed skill when available.
- For libraries/frameworks, use Context7 first per MCP instructions.
- For OpenRouter, use official OpenRouter docs. Current source links:
  - Structured outputs: https://openrouter.ai/docs/guides/features/structured-outputs
  - Chat completions: https://openrouter.ai/docs/api-reference/chat-completion
  - Parameters: https://openrouter.ai/docs/api-reference/parameters
- For GitHub App and webhook behavior, use official GitHub REST/Webhook/App docs before implementation.
- Record any discovered integration caveat here after proving it in code or docs.

## Current key libraries and services

### Vite / React / React Router

- Used by `apps/web` for the dashboard app.
- React version comes from workspace catalog: React 19.
- Routing is in `apps/web/src/App.tsx` using `react-router-dom`.
- Preserve the current SPA route model unless architecture is explicitly changed.

### Hono

- Used by `apps/api/src/index.ts` for the API server.
- Owns CORS, logger, Better Auth route mounting, oRPC/OpenAPI handler mounting, root health route, and error boundary.
- Webhook routes should live at the Hono layer because they need raw request body access before JSON parsing.
- Installed skill: `hono` is available and should be loaded for Hono-specific route/middleware work.

### oRPC

- Used for type-safe API procedures.
- Server handlers are mounted through `@orpc/server/fetch` and `@orpc/openapi/fetch`.
- Router entrypoint: `packages/api/src/routers/index.ts`.
- Client entrypoint: `apps/web/src/runtime.ts` through `@agentclave/api-client`.
- Keep procedures thin and delegate durable workflows to services/worker jobs.

### Better Auth

- Used for authentication and organizations in `packages/auth/src/index.ts`.
- Drizzle adapter uses schema from `@agentclave/db/schema/auth`.
- Organization plugin uses local `ac` and `roles` from `packages/auth/src/permissions.ts`.
- Session creation hook sets `activeOrganizationId` from the user's earliest membership.
- Installed skill: `better-auth-best-practices` is available and should be loaded before changing auth/plugin/session behavior.

### Drizzle ORM / PostgreSQL

- Used by `packages/db` for schema and migrations.
- Business schema is currently in `packages/db/src/schema/business.ts`.
- Auth schema is in `packages/db/src/schema/auth.ts`.
- Drizzle push/migration scripts are exposed through root package scripts.
- Use Drizzle schema and database constraints for idempotency-critical behavior.

### BullMQ / Redis

- Installed and wired for background jobs in Phase 2.
- Redis service in `docker-compose.yml` (image `redis:7-alpine`, port 6379, healthcheck via `redis-cli ping`).
- Env var: `REDIS_URL` (default `redis://localhost:6379`).
- `packages/api/src/core/queues.ts` provides shared `createRedisConnection()` (IORedis with `maxRetriesPerRequest: null`) and lazy queue producers.
- Queue names: `runguard-triage` and `runguard-github-executor` (constants in `packages/types`).
- Job payload schemas: `triageJobPayloadSchema` (`{ runId: string }`) and `githubExecutorJobPayloadSchema` (`{ actionId: string }`) in `packages/schemas`.
- `apps/worker` process starts BullMQ `Worker` instances with concurrency 1 for both queues.
- Job payloads carry IDs, not full mutable domain snapshots. Load current state from Postgres inside the job.

### OpenRouter

- Selected runtime LLM provider.
- OpenAI-compatible endpoint: `https://openrouter.ai/api/v1/chat/completions`.
- Use `Authorization: Bearer <OPENROUTER_API_KEY>`.
- Use `response_format.type = "json_schema"` with `strict: true` and `additionalProperties: false` for structured triage output when supported.
- Still validate response content with Zod after parsing.
- Use model/provider routing options such as `require_parameters: true` when strict structured output support is required.
- Tests should not require live OpenRouter calls.

### GitHub App / GitHub REST API

- Selected integration model for repository connection, webhook receipt, and approved action execution.
- Webhook signature header: `x-hub-signature-256`.
- Store GitHub App secrets in env: app id, private key, client id/secret if needed, webhook secret.
- Store installation and repository metadata in Postgres.
- Mint installation access tokens just in time for executor jobs.
- Supported MVP webhook events: `issues.opened`, `issues.edited`.
- Supported MVP executor actions: add label and post issue comment.

### octokit (GitHub App client)

- Installed in Phase 2 for GitHub App integration.
- `packages/api/src/core/github/app.ts` uses `App` from `octokit` to create a GitHub App client.
- `getInstallationOctokit(installationId)` returns an authenticated Octokit instance for a specific installation.
- `GITHUB_APP_PRIVATE_KEY` stored in env as a single line with literal `\n` escapes; normalized with `.replace(/\\n/g, "\n")` before passing to octokit.
- `GITHUB_APP_ID` stored in env as a positive integer.

### TanStack Query

- Used by the web runtime through `@agentclave/api-client` and `@orpc/tanstack-query` dependency.
- Product pages should use query/mutation hooks rather than manual fetch calls.
- Keep cache invalidation close to mutations that change runs, actions, approvals, settings, and policies.

### TanStack Form / `@agentclave/ui` form system

- Shared form system exists under `packages/ui/src/components/forms` with docs at `packages/ui/docs/forms.md`.
- Entry point: `@agentclave/ui/components/forms/tanstack-form`.
- Use `useAppForm` for form instances, `useFormFields<TValues>()` for type-safe flat `FormXxxField` names, `form.AppField` for custom/specialized controls, `FormErrors` for form-level errors, and `scrollToFirstError()` after invalid submit.
- `packages/ui` dependencies include `@tanstack/react-form`, `@tanstack/form-core`, `react-number-format` for `FormNumberField`, and `react-dropzone` for file upload fields.
- The bundled forms docs still mention `@labq-modules/*`; adapt examples to `@agentclave/ui/*` and keep shared API-backed Zod schemas in `packages/schemas`.

### TanStack Table / `@agentclave/ui` data table

- Shared table system exists under `packages/ui/src/components/table`, hook at `packages/ui/src/hooks/use-data-table.ts`, helpers in `packages/ui/src/lib/data-table.ts` and `packages/ui/src/lib/parsers.ts`, and docs at `packages/ui/docs/table.md`.
- Use for operational tables: runs, audit logs, eval samples, policies, agents, repositories, and approvals when the UI shape is tabular.
- Entry points: `@agentclave/ui/components/table`, `@agentclave/ui/hooks/use-data-table`, `@agentclave/ui/lib/data-table`, and `@agentclave/ui/lib/parsers`.
- `useDataTable` owns TanStack Table state plus nuqs URL state for `page`, `perPage`, `sort`, and column filters. Always pass a correct `pageCount`.
- Columns that participate in toolbar filtering need `ColumnDef.meta` (`label`, `placeholder`, `variant`, `options`, `range`, `unit`, `icon`) and `enableColumnFilter: true`.
- Use `getSortingStateParser(columnIds)` when reading sort state from URL params. Pin select/action columns through `initialState.columnPinning`, not a separately controlled table state object.
- The bundled table docs still mention `@labq-modules/*` and include Next/server examples; adapt imports to `@agentclave/ui/*` and the current Vite React/TanStack Query data flow. The current table source uses static strings, so the docs' `next-intl` note is stale.

### shadcn / Base UI / Tailwind 4

- `packages/ui` contains shared primitives styled with Tailwind 4 tokens and Base UI where applicable.
- Installed skills: `shadcn`, `frontend-design`, `impeccable`, `web-design-guidelines`, and `imprint` are available for UI-heavy work.
- Token source: `packages/ui/src/styles/globals.css`.

### vite-plus

- Used for workspace build/check/dev conventions.
- Root scripts use `vp run`, `vp check --fix`, and `vp config`.
- Formatting uses tabs and double quotes.
- Lint/type options are defined in `vite.config.ts`.
- Vitest: catalog `latest`.

## Version notes from workspace catalog

- TypeScript: catalog `^6`.
- Hono: catalog `^4.8.2`.
- oRPC packages: catalog `^1.13.14`.
- Better Auth: catalog `1.6.11`.
- React/React DOM: catalog `^19.2.6`.
- Tailwind CSS: catalog `^4.1.18`.
- Drizzle ORM: catalog `^0.45.1`.
- Vite: catalog `^6.0.0`.
- Vitest: catalog `latest`.
- BullMQ: catalog `^5.50.0`.
- IORedis: catalog `5.10.1` (pinned to match bullmq's internal dependency).
- octokit: catalog `^4.1.0`.

## Project-specific caveats

- The PRD's Next.js recommendation is non-binding; the project uses Vite React and Hono/oRPC.
- Existing starter references to `@labq-modules/*` are stale; use `@agentclave/*`.
- Existing pages are placeholders; do not infer finished UX from them.
- Existing dashboard cards are navigation placeholders, not final metric cards.
- Existing `packages/ui/docs/forms.md` and `packages/ui/docs/table.md` contain useful component guidance but stale `@labq-modules/*` import names. The table docs also include stale Next/server and `next-intl` notes.
- Phase 1 vocabulary cutover is complete; all enums and schemas use PRD `github.*` names.
