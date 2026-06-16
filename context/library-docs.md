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
- For oRPC pubsub/event iterators, use Context7 on `/dinwwwh/orpc` (or the official `unnoq.com/orpc` site) before changing subscription code.
- For Telegram Bot API webhook and approval-reply patterns, use official Telegram docs.
- For BullMQ / IORedis, use official docs before changing job or pubsub wiring.
- Record any discovered integration caveat here after proving it in code or docs.

## Current key libraries and services

### Vite / React / React Router

- Used by `apps/web` for the dashboard app.
- React version comes from workspace catalog: React 19.
- Routing is in `apps/web/src/App.tsx` using `react-router-dom` (catalog `^7.1.0`).
- `App.tsx` currently mounts: `/auth/sign-in`, `/auth/sign-up`, `/`, `/agents`, `/agents/:id`, `/tools`, `/tools/:id`, `/runs`, `/runs/:id`, `/settings` (with `organization` and `connectors` children). Standalone `/approvals` and `/audit` were removed; their content lives on run detail.
- Preserve the current SPA route model unless architecture is explicitly changed.

### Hono

- Used by `apps/api/src/index.ts` for the API server.
- Owns CORS, logger, Better Auth route mounting, oRPC RPC + OpenAPI handler mounting, custom webhook route mounting at `/api/webhooks/custom/:publicToken`, root health route, and error boundary.
- Webhook routes live at the Hono layer because they need raw request body access before JSON parsing.
- Installed skill: `hono` is available and should be loaded for Hono-specific route/middleware work.

### oRPC

- Used for type-safe API procedures.
- Server handlers are mounted through `@orpc/server/fetch` (RPC at `/rpc/*`) and `@orpc/openapi/fetch` (OpenAPI at `/api/*`).
- Router entrypoint: `packages/api/src/routers/index.ts`.
- Client entrypoint: `apps/web/src/runtime.ts` through `@agentclave/api-client` (createQueryClient, createOrpcLink, createApiClient, createOrpc).
- Keep procedures thin and delegate durable workflows to services and worker jobs.
- The `EventPublisher` and `MemoryPublisher` primitives live in `@orpc/server` and `@orpc/experimental-publisher/memory`.
- The `IORedisPublisher` adapter lives in `@orpc/experimental-publisher/ioredis` and requires two `ioredis` connections (commander + listener).
- Event iterators are first-class transports; the `RPCHandler` handles them without extra config.
- `@orpc/tanstack-query` exposes `useSubscription` for live event-iterator consumers. The hook's `status` is `connecting` / `open` / `closed`.

### Better Auth

- Used for authentication and organizations in `packages/auth/src/index.ts`.
- Drizzle adapter uses schema from `@agentclave/db/schema/auth`.
- Organization plugin uses local `ac` and `roles` from `packages/auth/src/permissions.ts`.
- Session creation hook sets `activeOrganizationId` from the user's earliest membership.
- Installed skill: `better-auth-best-practices` is available and should be loaded before changing auth/plugin/session behavior.

### Drizzle ORM / PostgreSQL

- Used by `packages/db` for schema and migrations.
- Business schema is in `packages/db/src/schema/business.ts`.
- Auth schema is in `packages/db/src/schema/auth.ts`.
- Drizzle push/migration scripts are exposed through `packages/db` package scripts (`db:push`, `db:generate`, `db:migrate`, `db:studio`).
- Use Drizzle schema and database constraints for idempotency-critical behavior.

### BullMQ / Redis

- Installed and wired for background jobs.
- Redis service in `docker-compose.yml` (image `redis:7-alpine`, port 6379, healthcheck via `redis-cli ping`).
- Env var: `REDIS_URL` (default `redis://localhost:6379`).
- `packages/api/src/core/queues.ts` provides shared `createRedisConnection()` (IORedis with `maxRetriesPerRequest: null`) and lazy queue producers.
- Queue names: `agentclave-agent-run` and `agentclave-tool-execution` (constants in `packages/types`).
- Job payload schemas: `agentRunJobPayloadSchema` (`{ runId: string }`) and `toolExecutionJobPayloadSchema` (`{ toolRequestId: string }`) in `packages/schemas`.
- `apps/worker` process starts BullMQ `Worker` instances for both queues.
- Job payloads carry IDs, not full mutable domain snapshots. Load current state from Postgres inside the job.

### OpenRouter

- Selected runtime LLM provider.
- OpenAI-compatible endpoint: `https://openrouter.ai/api/v1/chat/completions`.
- Use `Authorization: Bearer <OPENROUTER_API_KEY>`.
- Use `response_format.type = "json_schema"` with `strict: true` and `additionalProperties: false` for structured agent output.
- Still validate response content with Zod after parsing.
- Use model/provider routing options such as `require_parameters: true` when strict structured output support is required.
- Tests should not require live OpenRouter calls.

### Ajv (JSON schema validation)

- Used by `packages/api/src/core/json-schema/validate.ts` to validate tool input/output schemas at create/update time and tool call payloads at runtime.
- Provide `strict: true` and a custom logger that surfaces path + message.

### oRPC `experimental-publisher` (Realtime)

- Used by `packages/api/src/core/realtime/publisher.ts` to fan out `run.updated` and `approval.pending` events over the existing Redis instance.
- Two `ioredis` clients are required: one for `PUBLISH` (commander) and one for `SUBSCRIBE` (listener). The listener connection stays in subscribe mode and cannot be reused for normal commands.
- Event types are declared via TypeScript generics on the publisher; only declared events can be published.
- `resumeRetentionSeconds` is left at its default in MVP (resume not required for the demo loop).
- API surface: `publisher.publish(event, payload)` (server side), `publisher.subscribe(event, { signal })` (server side, returns an async iterator).

### TanStack Query

- Used by the web runtime through `@agentclave/api-client` and `@orpc/tanstack-query` dependency.
- Product pages should use `useQuery(orpc.x.queryOptions(input))` and `useMutation(orpc.x.mutationOptions(...))`, not manual `fetch` calls.
- Keep cache invalidation close to mutations that change runs, actions, approvals, settings, and policies. Realtime subscriptions call `invalidateQueries` on the same keys.
- `useSubscription` is the live-event consumer; treat its lifecycle (`connecting` / `open` / `closed`) as the source of truth for the connection-state badge.

### TanStack Form / `@agentclave/ui` form system

- Shared form system exists under `packages/ui/src/components/forms` with docs at `packages/ui/docs/forms.md`.
- Entry point: `@agentclave/ui/components/forms/tanstack-form`.
- Use `useAppForm` for form instances, `useFormFields<TValues>()` for type-safe flat `FormXxxField` names, `form.AppField` for custom/specialized controls, `FormErrors` for form-level errors, and `scrollToFirstError()` after invalid submit.
- The bundled forms docs still mention `@labq-modules/*`; adapt examples to `@agentclave/ui/*` and keep shared API-backed Zod schemas in `packages/schemas`.

### TanStack Table / `@agentclave/ui` data table

- Shared table system exists under `packages/ui/src/components/table`, hook at `@agentclave/ui/hooks/use-data-table`, helpers in `@agentclave/ui/lib/data-table` and `@agentclave/ui/lib/parsers`, and docs at `packages/ui/docs/table.md`.
- Use for operational tables: runs, audit logs, eval samples, policies, agents, and connectors.
- Entry points: `@agentclave/ui/components/table`, `@agentclave/ui/hooks/use-data-table`, `@agentclave/ui/lib/data-table`, `@agentclave/ui/lib/parsers`.
- `useDataTable` owns TanStack Table state plus nuqs URL state for `page`, `perPage`, `sort`, and column filters. Always pass a correct `pageCount`.
- Columns that participate in toolbar filtering need `ColumnDef.meta` (`label`, `placeholder`, `variant`, `options`, `range`, `unit`, `icon`) and `enableColumnFilter: true`.
- Use `getSortingStateParser(columnIds)` when reading sort state from URL params. Pin select/action columns through `initialState.columnPinning`.
- The bundled table docs still mention `@labq-modules/*` and include Next/server examples; adapt imports to `@agentclave/ui/*` and the current Vite React/TanStack Query data flow.
- The current apps in this repo keep column definitions in feature-local files (e.g. `apps/web/src/features/tools/tools-columns.tsx`, `apps/web/src/features/settings/connectors-columns.tsx`) and import them into the page component.

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
- oRPC packages: catalog `^1.13.14`. The `experimental-publisher` subpath will be added at the same version when Phase 9 ships.
- Better Auth: catalog `1.6.11`.
- React/React DOM: catalog `^19.2.6`.
- Tailwind CSS: catalog `^4.1.18`.
- Drizzle ORM: catalog `^0.45.1`.
- Vite: catalog `^6.0.0`.
- Vitest: catalog `latest`.
- BullMQ: catalog `^5.50.0`.
- IORedis: catalog `5.10.1` (pinned to match bullmq's internal dependency). The realtime publisher reuses the same library, not the same connection.
- Ajv: catalog `^8.17.1`.
- octokit: catalog `^4.1.0` (present in the lockfile from the GitHub era; no longer imported by product code).

## Project-specific caveats

- The PRD's Next.js recommendation is non-binding; the project uses Vite React and Hono/oRPC.
- Existing starter references to `@labq-modules/*` are stale; use `@agentclave/*`.
- Existing pages are placeholders or partial implementations; do not infer finished UX from them.
- Existing `packages/ui/docs/forms.md` and `packages/ui/docs/table.md` contain useful component guidance but stale `@labq-modules/*` import names. The table docs also include stale Next/server and `next-intl` notes.
- Phase 1 vocabulary cutover is complete; all enums, schemas, and routers use the AgentClave vocabulary (tools, tool_requests, approval_sessions, etc.). No GitHub-era `proposed_actions` / `github.add_label` / `github.post_comment` types remain in product code.
- The seed guards on `TELEGRAM_BOT_TOKEN`: when the env var is empty, the Telegram connector, the `telegram.send_message` tool, and the inbound webhook endpoint are not inserted. The Demo Inventory connector and the three inventory tools always seed.
- `octokit` remains in the dependency tree for historical reasons. Do not import it in new code; remove if a future cleanup pass touches the catalog.
