# UI Registry

This file records implemented visual patterns that future UI should match. Update it after adding or materially changing reusable UI.

## App shell

File: `apps/web/src/components/layout/dashboard-layout.tsx`
Last updated: 2026-06-15

| Property        | Class / Token     |
| --------------- | ----------------- |
| Layout provider | `SidebarProvider` |
| Sidebar         | `AppSidebar`      |
| Content wrapper | `SidebarInset`    |
| Header          | `Header`          |
| Route content   | `Outlet`          |

**Pattern notes:** Authenticated pages live inside the sidebar shell. Do not create a parallel shell for dashboard routes.

## Sidebar navigation

File: `apps/web/src/components/layout/app-sidebar.tsx`
Last updated: 2026-06-16

| Property        | Class / Token                                                                             |
| --------------- | ----------------------------------------------------------------------------------------- |
| Container       | `Sidebar collapsible="icon"`                                                              |
| Brand mark      | `bg-primary/10`, `size-8`, `rounded-lg`, `text-sm font-bold`                              |
| Brand text      | `font-semibold`, workspace name as `text-muted-foreground text-sm`                        |
| Active item     | `SidebarMenuButton isActive`                                                              |
| Open menu state | `data-[state=open]:bg-sidebar-accent`, `data-[state=open]:text-sidebar-accent-foreground` |
| Footer avatar   | `size-8 rounded-lg`                                                                       |
| Account menu    | `DropdownMenuContent`, `min-w-56`, `rounded-lg`                                           |

**Pattern notes:** Navigation labels come from `apps/web/src/config/nav-config.ts`; icon names map to Lucide icons in the sidebar component. The sidebar has exactly 5 items: Dashboard, Agents, Tools, Runs, Settings. Connectors lives under Settings as a tab.

## Settings shell

File: `apps/web/src/components/layout/settings-layout.tsx`
Last updated: 2026-06-16

| Property       | Component / Rule                                        |
| -------------- | ------------------------------------------------------- |
| Layout         | `SettingsLayout` wrapping child routes                  |
| Tab navigation | `Tabs`, `TabsList`, `TabsTrigger` from `@agentclave/ui` |
| Route-driven   | Tab value driven by `useLocation` pathname              |
| Tab ids        | `organization`, `connectors`                            |

**Pattern notes:** Settings uses the shared tabs primitive for tab navigation. The tab value changes route via `useNavigate` on `onValueChange`. Do not invent a custom tab strip.

## Sticky header

File: `apps/web/src/components/layout/header.tsx`
Last updated: 2026-06-15

| Property       | Class / Token                                                                                       |
| -------------- | --------------------------------------------------------------------------------------------------- |
| Position       | `sticky top-0 z-20`                                                                                 |
| Size           | `h-16 md:h-14`                                                                                      |
| Background     | `bg-background/60 backdrop-blur-md`                                                                 |
| Border         | `border-b`                                                                                          |
| Left controls  | `SidebarTrigger`, vertical `Separator`                                                              |
| Right controls | `AnimatedThemeToggler` and (planned) the realtime connection badge                                  |
| Theme button   | `h-9 w-9 rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground` |

**Pattern notes:** Header is utility/navigation chrome, not a page-title area. Page titles belong inside route content.

## Dashboard cards

File: `apps/web/src/features/dashboard/dashboard.tsx`
Last updated: 2026-06-15

| Property           | Class / Token                              |
| ------------------ | ------------------------------------------ |
| Page spacing       | `space-y-8 p-6`                            |
| Page title         | `text-2xl font-bold`                       |
| Secondary copy     | `text-muted-foreground`                    |
| Card grid          | `grid gap-4 md:grid-cols-2 lg:grid-cols-3` |
| Linked card hover  | `transition-colors hover:bg-muted/50`      |
| Card header layout | `flex flex-row items-center gap-3`         |
| Card icon          | `h-5 w-5 text-muted-foreground`            |
| Card title         | `text-base` through `CardTitle` override   |
| Card body copy     | `text-sm text-muted-foreground`            |

**Pattern notes:** The current dashboard is a navigation hub. Metrics cards should keep the same card primitives and spacing when replacing the placeholder cards.

## Card primitive

File: `packages/ui/src/components/card.tsx`
Last updated: 2026-06-15

| Property    | Class / Token                                                |
| ----------- | ------------------------------------------------------------ |
| Base        | `group/card flex flex-col gap-6 overflow-hidden`             |
| Background  | `bg-card text-card-foreground`                               |
| Radius      | `rounded-4xl`                                                |
| Elevation   | `shadow-md ring-1 ring-foreground/5 dark:ring-foreground/10` |
| Padding     | `py-6`, content/header `px-6`                                |
| Small size  | `data-[size=sm]:gap-4 data-[size=sm]:py-4`, inner `px-4`     |
| Title       | `font-heading text-base font-medium`                         |
| Description | `text-sm text-muted-foreground`                              |

**Pattern notes:** Product panels should use this primitive rather than duplicating card class strings.

## Button primitive

File: `packages/ui/src/components/button.tsx`
Last updated: 2026-06-15

| Property            | Class / Token                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------- |
| Base                | `inline-flex shrink-0 items-center justify-center rounded-4xl text-sm font-medium transition-all` |
| Focus               | `focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30`                       |
| Disabled            | `disabled:pointer-events-none disabled:opacity-50`                                                |
| Default variant     | `bg-primary text-primary-foreground hover:bg-primary/80`                                          |
| Outline variant     | `border-border bg-background hover:bg-muted hover:text-foreground`                                |
| Secondary variant   | `bg-secondary text-secondary-foreground hover:bg-secondary/80`                                    |
| Ghost variant       | `hover:bg-muted hover:text-foreground`                                                            |
| Destructive variant | `bg-destructive/10 text-destructive hover:bg-destructive/20`                                      |
| Default size        | `h-9 gap-1.5 px-3`                                                                                |
| Loading             | `isLoading` with `Loader2 animate-spin`                                                           |

**Pattern notes:** Approval, rejection, edit, retry, and execution controls should use this primitive and its loading state.

## Badge primitive

File: `packages/ui/src/components/badge.tsx`
Last updated: 2026-06-15

| Property    | Class / Token                                                                                   |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Base        | `inline-flex h-5 items-center justify-center gap-1 rounded-3xl px-2 py-0.5 text-xs font-medium` |
| Default     | `bg-primary text-primary-foreground`                                                            |
| Secondary   | `bg-secondary text-secondary-foreground`                                                        |
| Destructive | `bg-destructive/10 text-destructive`                                                            |
| Outline     | `border-border text-foreground`                                                                 |
| Ghost       | `hover:bg-muted hover:text-muted-foreground`                                                    |

**Pattern notes:** Status and policy badges should prefer existing variants before adding semantic status colors.

## Shared form system

Files:

- `packages/ui/src/components/forms/tanstack-form.tsx`
- `packages/ui/src/components/forms/form-context.tsx`
- `packages/ui/src/components/forms/fields/*-field.tsx`
- `packages/ui/docs/forms.md`

Last updated: 2026-06-15

| Property           | Component / Rule                                                                                                                                                                                                                                             |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Main hook          | `useAppForm` from `@agentclave/ui/components/forms/tanstack-form`                                                                                                                                                                                            |
| Typed field helper | `useFormFields<TValues>()` with `z.infer<typeof schema>`                                                                                                                                                                                                     |
| Standard fields    | Flat `FormTextField`, `FormTextareaField`, `FormSelectField`, `FormCheckboxField`, `FormSwitchField`, `FormRadioGroupField`, `FormSliderField`, `FormFileUploadField`, `FormNumberField`, `FormComboboxField`, `FormMonthPickerField`, `FormDatePickerField` |
| Custom fields      | `form.AppField` with `form.FieldSet`, `form.Field`, label/description primitives, and `form.FieldError`                                                                                                                                                      |
| Submit shell       | `form.AppForm` + `form.Form` + `form.SubmitButton`                                                                                                                                                                                                           |
| Error behavior     | Field errors show after touch or first failed submit; `FormErrors` handles form-level errors                                                                                                                                                                 |
| Invalid focus      | `scrollToFirstError()` after invalid submit                                                                                                                                                                                                                  |

**Pattern notes:** Use `packages/ui/docs/forms.md` as the guide for any rendered form. The docs still contain stale `@labq-modules/*` imports; use `@agentclave/ui/*` in this repo. Keep shared API-backed schemas in `packages/schemas`; use form-level `validators: { onSubmit: schema }` as the required safety net.

## Data table system

Files:

- `packages/ui/src/components/table/*`
- `packages/ui/src/hooks/use-data-table.ts`
- `packages/ui/src/lib/data-table.ts`
- `packages/ui/src/lib/parsers.ts`
- `packages/ui/src/types/data-table.ts`
- `packages/ui/docs/table.md`

Last updated: 2026-06-15

| Property       | Component / Rule                                                           |
| -------------- | -------------------------------------------------------------------------- |
| Main table     | `DataTable` from `@agentclave/ui/components/table`                         |
| URL/table hook | `useDataTable` from `@agentclave/ui/hooks/use-data-table`                  |
| Header sorting | `DataTableColumnHeader`                                                    |
| Filter toolbar | `DataTableToolbar` with column `meta.variant` and `enableColumnFilter`     |
| Filters        | Text/number, faceted select/multi-select, date/dateRange, and slider/range |
| Loading state  | `DataTableSkeleton` with matching columns and widths                       |
| Pinned columns | `initialState.columnPinning`, usually right-pinning `actions`              |
| URL state      | nuqs-backed `page`, `perPage`, `sort`, and per-column filter params        |

**Pattern notes:** Use `packages/ui/docs/table.md` as the guide for runs, audit logs, eval samples, agents, policies, and other operational tables. The guide has stale `@labq-modules/*` and Next/server examples; adapt imports to `@agentclave/ui/*` and Vite React data flow. Always pass a real `pageCount` and use `getSortingStateParser(columnIds)` when reading sort state from URL params. Column definitions for each feature live in a feature-local `*-columns.tsx` (e.g. `apps/web/src/features/tools/tools-columns.tsx`, `apps/web/src/features/settings/connectors-columns.tsx`).

## Current feature pages

Files:

- `apps/web/src/features/dashboard/dashboard.tsx`
- `apps/web/src/features/agents/agents.tsx`
- `apps/web/src/features/agents/agent-detail.tsx`
- `apps/web/src/features/runs/runs.tsx`
- `apps/web/src/features/runs/run-detail.tsx`
- `apps/web/src/features/tools/tools.tsx`
- `apps/web/src/features/tools/tools-columns.tsx`
- `apps/web/src/features/tool-detail.tsx`
- `apps/web/src/features/settings/organization.tsx`
- `apps/web/src/features/settings/connectors.tsx`
- `apps/web/src/features/settings/connectors-columns.tsx`
- `apps/web/src/features/auth/sign-in.tsx`
- `apps/web/src/features/auth/sign-up.tsx`
- `apps/web/src/features/auth/auth-form-layout.tsx`

Last updated: 2026-06-16

| Property         | Class / Token           |
| ---------------- | ----------------------- |
| Page shell       | `p-6`                   |
| Title            | `text-2xl font-bold`    |
| Placeholder copy | `text-muted-foreground` |

**Pattern notes:** Replace these in place. Keep page-level padding and heading hierarchy unless a shared product page header component is introduced. All feature code (page components, feature-local hooks, components, types) lives under `apps/web/src/features/<feature>/`. Cross-feature code lives in `apps/web/src/{components,hooks,lib,types}/` or `@agentclave/ui`. Tools and Settings → Connectors are the first `DataTable` consumers in `apps/web`, with column definitions in their feature files. The standalone Approvals and Audit pages have been removed; their content now lives on Run Detail.

## Run detail inspection screen

File: `apps/web/src/features/runs/run-detail.tsx`
Last updated: 2026-06-16

| Section              | Class / Token                                                                  |
| -------------------- | ------------------------------------------------------------------------------ |
| Page shell           | `space-y-6 p-6`                                                                |
| Summary grid         | `grid gap-4 md:grid-cols-3`                                                    |
| Step timeline row    | `flex items-center gap-3 text-sm` with `text-muted-foreground w-8` for index   |
| Pending review card  | `Card` with payload as `<pre class="text-xs">` (truncate to 300 chars)         |
| Approval session row | `flex items-center gap-3 text-sm` with `Badge variant="outline"` for status    |
| Audit log row        | `flex items-center gap-4 py-3` with `ScrollText` icon and `divide-y` container |
| Error block          | `Card` with `border-destructive/50` and `text-destructive`                     |

**Pattern notes:** Run detail is the primary inspection surface. The pending review requests card and the approval sessions card are stacked under the tool requests card. The audit log snippet is at the bottom. Inline Approve / Reject lives inside the pending review requests card; the button pair is followed by an expandable `note` textarea on Reject. Both call `toolRequests.reviewApproval`.

## Sheet-on-detail (edit pattern)

File: `apps/web/src/components/ui/sheet` (via `@agentclave/ui/components/sheet`)
Last updated: 2026-06-16

| Property           | Class / Token                                                  |
| ------------------ | -------------------------------------------------------------- |
| Trigger button     | `Button variant="outline" size="sm"` in the detail page header |
| Content padding    | match the detail page `p-6` baseline                           |
| Footer             | `form.SubmitButton` left, ghost `Cancel` right                 |
| Close behavior     | `onOpenChange(false)` after `mutation.isSuccess`               |
| Cache invalidation | `queryClient.invalidateQueries({ queryKey: detailKey })`       |

**Pattern notes:** Edit forms on agents, tools, and connectors open in a sheet from the detail page header. The detail page stays mounted so the operator can see what they are editing. Use the shared `useAppForm` system; JSON-textarea fields surface Ajv validation errors through `FormErrors`. Do not open a centered dialog for these.

## AlertDialog (destructive confirm pattern)

File: `apps/web/src/components/ui/alert-dialog` (via `@agentclave/ui/components/alert-dialog`)
Last updated: 2026-06-16

| Property     | Class / Token                                                 |
| ------------ | ------------------------------------------------------------- |
| Trigger      | `Button variant="destructive" size="sm"` in the row or header |
| Action label | Verb in title case, e.g. "Rotate secret", "Delete connector"  |
| Cancel       | `Button variant="outline"`                                    |
| Loading      | `Button isLoading` while mutation is in flight                |

**Pattern notes:** Use for rotate-secret and delete on tools, agents, connectors, and webhook endpoints. Short, blocking. The visual weight of a dialog is the point.

## Realtime connection badge

File: `apps/web/src/components/realtime/connection-badge.tsx` (planned in Phase 9)
Last updated: 2026-06-16

| Property           | Class / Token                                                             |
| ------------------ | ------------------------------------------------------------------------- |
| Position           | In the sticky `Header`, right side, between `Separator` and theme toggler |
| Status: open       | small `bg-emerald-500` dot + `Live` text                                  |
| Status: connecting | small `bg-amber-500` dot + `Reconnecting` text + subtle spinner           |
| Status: closed     | small `bg-muted-foreground` dot + `Offline` text                          |

**Pattern notes:** Subscribes to the same `useRealtimeSubscription` hook the page consumes. Uses the `connecting` / `open` / `closed` lifecycle from `@orpc/tanstack-query`'s `useSubscription`. Renders a small dot and label only — no controls.

## Test run trigger card

File: `apps/web/src/features/agents/agent-detail.tsx` (planned in Phase 9)
Last updated: 2026-06-16

| Property      | Class / Token                                                 |
| ------------- | ------------------------------------------------------------- |
| Container     | `Card` with header "Test run" and description                 |
| Message input | `Textarea` 3 rows, placeholder "Stok Bakso Solo beda..."      |
| Action        | `Button` with `isLoading` while `agents.testRun` is in flight |
| On success    | `navigate(\`/runs/\${runId}\`)` after toast                   |

**Pattern notes:** Drives the runtime loop without a real Telegram bot. Goes through the full policy, approval, audit, and tool execution paths. The operator sees the run transition live via the realtime subscription.
