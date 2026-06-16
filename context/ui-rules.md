# UI Rules

## Layout

- The authenticated app uses `DashboardLayout`: `SidebarProvider`, `AppSidebar`, `SidebarInset`, sticky `Header`, then route content through `Outlet`.
- The settings area is a sibling: `SettingsLayout` with `Tabs` for `Organization` and `Connectors` and an `Outlet` for the active tab. It uses the same `p-6` page shell.
- Product pages use `p-6`; preserve that baseline unless a page-specific layout component intentionally standardizes spacing.
- Use vertical rhythm with `space-y-6` or `space-y-8` for dashboard-like pages.
- Use responsive grids for summary cards: start one column, then `md:grid-cols-2`, then `lg:grid-cols-3` or `lg:grid-cols-4` as needed.
- Keep the header sticky and translucent: `bg-background/60`, `backdrop-blur-md`, `border-b`.

## Navigation

- Primary navigation is sidebar-based and configured in `apps/web/src/config/nav-config.ts`.
- Sidebar items use `SidebarMenuButton` with `isActive` based on exact path or section prefix.
- Keep product-level destinations stable: Dashboard, Agents, Tools, Runs, Settings. The settings area holds Organization and Connectors.
- There is no `/approvals` or `/audit` route in MVP. Approvals and audit live on the run detail page. Do not add hidden navigation paths without also updating the sidebar or an obvious in-page link.

## Cards and panels

- Use `@agentclave/ui/components/card` for dashboard metrics, run summaries, approval cards, policy panels, and trace panels.
- Default card shape is large-radius, tokenized surface, `shadow-md`, and subtle ring. Do not recreate card classes manually in product pages.
- Card headers should carry the title and short description; card content carries metrics, tables, or action controls.
- Keep cards compact for operational scanning: title, one primary datum, then supporting metadata.

## Tables

- Use `packages/ui/docs/table.md` before building or changing operational tables. Treat examples as a pattern guide, but adapt stale `@labq-modules/*` imports and Next/server snippets to the current `@agentclave/*` Vite React app.
- Use `@agentclave/ui/components/table` components (`DataTable`, `DataTableToolbar`, `DataTableColumnHeader`, `DataTableSkeleton`) and `@agentclave/ui/hooks/use-data-table`; do not build a parallel table system in `apps/web`.
- Define TanStack `ColumnDef` metadata for toolbar filters: `label`, `placeholder`, `variant`, `options`, `range`, `unit`, and `icon`. Set `enableColumnFilter: true` only on columns that should render filter controls.
- Persist sorting, pagination, and filters through `useDataTable`/nuqs URL state. Pass the server `pageCount`, keep `page` 1-based in the URL, and pin action/select columns through `initialState.columnPinning`.
- Match `DataTableSkeleton` `columnCount`, `cellWidths`, filter count, and pagination/view-option flags to the real table to avoid layout shift.
- Tables should expose meaningful status, timestamp, and entity identifiers without requiring a detail-page click for basic triage.
- Link row titles/IDs to detail pages where a detail route exists.
- Avoid over-filtering the first MVP tables; use the filters named in product scope where they change real workflows.
- Column definitions live in feature-local `*-columns.tsx` files (e.g. `apps/web/src/features/tools/tools-columns.tsx`, `apps/web/src/features/settings/connectors-columns.tsx`) and are imported into the page component.

## Forms

- Use `packages/ui/docs/forms.md` and `packages/ui/src/components/forms/` before building settings or edit flows. Treat examples as a pattern guide, but adapt stale `@labq-modules/*` imports to `@agentclave/ui/*`.
- Import `useAppForm`, `useFormFields`, `FormErrors`, and `scrollToFirstError` from `@agentclave/ui/components/forms/tanstack-form`.
- Use `z.infer<typeof schema>` as the form value type and pass it to `useFormFields<TValues>()` so `FormXxxField` names stay type-checked.
- Standard fields use the flat `FormXxxField` components. Custom/specialized inputs use `form.AppField` with `form.FieldSet`, `form.Field`, labels/descriptions, and `form.FieldError`. Array inputs must pass `mode="array"`.
- Put the full Zod schema in `validators: { onSubmit: schema }` as the safety net. Field-level validators and listeners are for earlier UX feedback and dependent-field side effects.
- Use `form.Form` and `form.SubmitButton`; do not duplicate submit prevention, `noValidate`, `canSubmit`, loading, or disabled behavior in product pages.
- Validate form input with Zod schemas shared through `packages/schemas` when the same shape is used by API procedures.
- Settings forms should separate persisted settings from computed run/eval metrics.
- Destructive or externally mutating actions need explicit button labels and audit-backed server behavior.

## Forms for create vs edit

- **Create flows** (agent create, tool create, connector create) live on dedicated routes: `/agents/new`, `/tools/new`, `/connectors/new`. Forms are too long for a centered dialog; the route is shareable and matches the existing detail-route pattern.
- **Edit flows** open a **Sheet** from the detail page (`@agentclave/ui/components/sheet`). The operator stays on the same screen and can glance back at the data they are editing. The sheet trigger is a small "Edit" button in the detail header. The form uses the same shared schema, calls the relevant `update` procedure, and invalidates the detail query on success.
- **Destructive confirms** (rotate secret, delete tool, delete agent, delete connector, delete endpoint) use `AlertDialog` from `@agentclave/ui/components/alert-dialog`. Short, blocking, the visual weight of a dialog is the point.
- **Approve / Reject** on run detail is **inline** (button pair; Reject expands a `note` textarea). High-frequency action during a demo; the operator should not hunt for a sheet trigger. Approve calls `toolRequests.reviewApproval` with `decision: "approved"`. Reject with note calls `toolRequests.reviewApproval` with `decision: "rejected"`.

## Form-level errors from server validation

- Tool input/output JSON schemas are validated server-side with Ajv on create/update. When a textarea parses valid JSON but fails Ajv, the API returns an `ORPCError` whose message names the failing path. Surface that message through `FormErrors` (form-level) and use `scrollToFirstError()` to focus the first invalid field.
- Connector credentials are write-only. The form accepts a JSON object (`{ botToken }` / `{ apiKey }`) and the API encrypts and persists it. The UI never reads the credentials back; the existing connector card shows the config but never the credentials.

## Typography

- Page titles use `text-2xl font-bold` until a stronger heading primitive is introduced.
- Body and secondary text should use semantic tokens: `text-foreground` and `text-muted-foreground`.
- Do not use marketing-style oversized headings inside operational dashboard screens; this product is an operator control plane.
- Prefer short labels: Run status, Policy decision, Risk level, Cost, Latency, Reviewer, Execution result.

## Interaction

- Primary actions use `Button` default variant.
- Secondary actions use `outline`, `secondary`, or `ghost` variants.
- Reject/deny/destructive paths use `destructive` variant.
- Approve/reject/edit flows must surface loading and disabled states while the request is in flight.
- Approval edit UI must show the original payload and the edited payload clearly enough to audit the change.
- Any action that mutates an external system through a tool must be traceable to an approval/audit record.

## Realtime subscription

- `useSubscription` from `@orpc/tanstack-query` opens the SSE/event-iterator connection. Always call `queryClient.invalidateQueries` (or `setQueryData` for the run detail page) in `onData` to refresh the matching cache keys.
- Filter server-side by `organizationId` in the procedure; do not rely on the client to filter. The server-side filter is the security boundary.
- The connection-state badge in the sticky header subscribes to the same hook's lifecycle and renders `Live` (open) / `Reconnecting` (connecting) / `Offline` (closed).

## Product-specific UI rules

- Run detail is the primary inspection screen. It should prioritize status, trace timeline, tool requests, the **pending review requests** card (with inline Approve / Reject), the **approval sessions** card (history with approver, decision, note, and approval code), the audit log snippet, and the error block — over decorative content.
- The "approvals" surface lives on the run detail page, not on a standalone page. There is no `/approvals` route in MVP.
- The "audit" surface lives in two places: a snippet on the run detail page (top N rows for the run) and the audit query on the API. A standalone `/audit` page with filtering UI is deferred.
- The agent detail page hosts the "Test run" trigger: a card with a textarea and a Run button. On success the user is navigated to the new run's detail page.
- The connector detail (under Settings → Connectors) hosts the webhook endpoints list, the "New endpoint" sheet, and the per-endpoint "Rotate secret" and "Delete" alert dialogs.
- The settings layout uses `Tabs` (Organization / Connectors) inside the standard `p-6` page shell, not a parallel shell.
- Empty states must state what event creates data, for example: "Pending review requests appear after an agent run requests a tool whose policy requires approval."

## Never do this

- Do not hardcode raw color values or raw Tailwind palette classes in product pages.
- Do not create a second layout shell beside `DashboardLayout` for authenticated product pages.
- Do not let product pages call OpenRouter, the database, or connector credentials directly.
- Do not hide failed/denied actions from run detail; failed control-plane steps are core product evidence.
- Do not add one-off UI components in `apps/web` when they are reusable across pages; promote them to `packages/ui` or a clear local shared component first.
- Do not bypass the typed `orpc` client with raw `fetch` in new code. The migration of the existing read pages from `fetch` to `orpc` is a deferred, follow-up pass; do not add more `fetch` callers in the meantime.
- Do not open a dialog for a long create form or for a destructive action that should be a `Sheet` or `AlertDialog` instead.
