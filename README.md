# AgentClave

**Governed agent runtime for internal operations.**

AgentClave is an agentic platform that provides policy enforcement, human approval, audit logging, and evaluation metrics for every agent action. Connect any channel (Telegram, webhooks, APIs), configure typed tools, define policies, and let agents operate with governance.

## Architecture

```
apps/
  web                  — Single-page React app (Vite, port 5100)
  api                  — Hono + oRPC backend (port 4000)
  worker               — BullMQ job processor
  demo-inventory-api   — Demo external API (port 4301)

packages/
  ui           — Shared UI primitives (shadcn/ui based)
  schemas      — Shared Zod validation schemas
  api-client   — oRPC + TanStack Query client factory
  auth         — Better Auth with Organization plugin
  db           — Drizzle ORM schema and database
  env          — Environment variable validation
  types        — Shared TypeScript literal types
  email        — Email sending (Resend)
  config       — Shared tsconfig
```

## Quick Start

```bash
# Install dependencies
pnpm install

# Copy env file
cp .env.example .env

# Start PostgreSQL + Redis + MinIO
docker compose up -d postgres redis minio minio-setup

# Push database schema
pnpm db:push

# Start all dev servers (includes demo inventory API)
pnpm dev
```

## Local Demo

The demo seeds an Inventory Ops Agent with Telegram and Demo Inventory connectors:

1. Start the demo inventory API: `pnpm dev:demo-inventory-api`
2. Test it: `curl http://localhost:4301/products/search?q=Bakso`
3. The API serves fixture data for Bakso Solo 500g (SKU: BKSO-SOLO, quantity: 80)

## Development

| App            | Port | URL                   |
| -------------- | ---- | --------------------- |
| Web            | 5100 | http://localhost:5100 |
| API            | 4000 | http://localhost:4000 |
| Demo Inventory | 4301 | http://localhost:4301 |

## Commands

```bash
pnpm dev          # Start all dev servers
pnpm build        # Build all packages
pnpm check        # Lint and format
pnpm test         # Run unit tests
pnpm db:push      # Push Drizzle schema
pnpm db:studio    # Open Drizzle Studio
```

## Stack

- **Frontend**: React 19, Vite, React Router, TanStack Query, shadcn/ui
- **Backend**: Hono, oRPC, Drizzle ORM
- **Auth**: Better Auth + Organization plugin
- **Database**: PostgreSQL with Row Level Security
- **Queue**: BullMQ + Redis
- **AI**: OpenRouter with tool calling
- **Storage**: S3-compatible (MinIO local / Cloudflare R2 prod)
- **Package Manager**: pnpm
