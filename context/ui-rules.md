# UI Rules

## Layout

- The authenticated app uses `DashboardLayout`: `SidebarProvider`, `AppSidebar`, `SidebarInset`, sticky `Header`, then route content through `Outlet`.
- Product pages currently use `p-6`; preserve that baseline unless a page-specific layout component intentionally standardizes spacing.
- Use vertical rhythm with `space-y-6` or `space-y-8` for dashboard-like pages.
- Use responsive grids for summary cards: start one column, then `md:grid-cols-2`, then `lg:grid-cols-3` or `lg:grid-cols-4` as needed.
- Keep the header sticky and translucent: `bg-background/60`, `backdrop-blur-md`, `border-b`.

## Navigation

- Primary navigation is sidebar-based and configured in `apps/web/src/config/nav-config.ts`.
- Sidebar items use `SidebarMenuButton` with `isActive` based on exact path or section prefix.
- Keep product-level destinations stable: Dashboard, Agents, Runs, Approvals, Audit Log, Settings. Add Evals when the eval page is implemented.
- Do not add hidden navigation paths without also updating sidebar or an obvious in-page link.

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

## Typography

- Page titles use `text-2xl font-bold` until a stronger heading primitive is introduced.
- Body and secondary text should use semantic tokens: `text-foreground` and `text-muted-foreground`.
- Do not use marketing-style oversized headings inside operational dashboard screens; this product is an operator control plane.
- Prefer short labels: Run status, Policy decision, Confidence, Cost, Latency, Reviewer, Execution result.

## Interaction

- Primary actions use `Button` default variant.
- Secondary actions use `outline`, `secondary`, or `ghost` variants.
- Reject/deny/destructive paths use `destructive` variant.
- Approve/reject/edit flows must surface loading and disabled states while the request is in flight.
- Approval edit UI must show the original payload and the edited payload clearly enough to audit the change.
- Any action that mutates GitHub must be traceable to an approval/audit record.

## Product-specific UI rules

- Run detail is the primary inspection screen. It should prioritize trace timeline, proposed actions, policy decisions, agent output, and execution result over decorative content.
- Approval queue cards should be reviewable without navigating away: issue context, proposed label/comment, confidence, policy match, approve/reject/edit controls.
- Audit logs should be dense and filterable; do not turn them into cards unless there is a strong mobile reason.
- Eval screens should explain metrics with labels, not prose-heavy descriptions.
- Empty states must state what event creates data, for example: “Pending approvals appear after a GitHub issue triage run requires review.”

## Never do this

- Do not hardcode raw color values or raw Tailwind palette classes in product pages.
- Do not create a second layout shell beside `DashboardLayout` for authenticated product pages.
- Do not let product pages call GitHub, OpenRouter, or the database directly.
- Do not hide failed/denied actions from run detail; failed control-plane steps are core product evidence.
- Do not add one-off UI components in `apps/web` when they are reusable across pages; promote them to `packages/ui` or a clear local shared component first.
