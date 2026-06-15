# UI Tokens

## Source of truth

UI tokens live in `packages/ui/src/styles/globals.css` and are consumed by Tailwind 4 through `@theme inline`. The web app imports them once through `apps/web/src/index.css` with `@import "@agentclave/ui/globals.css"`.

Do not define product-page color values inline. Product UI should use semantic Tailwind classes backed by these variables: `bg-background`, `text-foreground`, `bg-card`, `text-card-foreground`, `text-muted-foreground`, `border-border`, `bg-primary`, `text-primary-foreground`, and related tokens.

## Color tokens

### Page and text

- `--background` / `bg-background` — app background.
- `--foreground` / `text-foreground` — primary text.
- `--muted` / `bg-muted` — subdued background regions.
- `--muted-foreground` / `text-muted-foreground` — secondary text and metadata.
- `--border` / `border-border` — default borders.
- `--input` / `border-input` or `bg-input` — input borders/backgrounds.
- `--ring` / `ring-ring` — focus rings.

### Surfaces

- `--card` / `bg-card` — card and panel background.
- `--card-foreground` / `text-card-foreground` — text on cards.
- `--popover` / `bg-popover` — dropdown/popover/dialog floating surface.
- `--popover-foreground` / `text-popover-foreground` — text on floating surfaces.

### Actions and emphasis

- `--primary` / `bg-primary`, `text-primary` — primary action or strong brand emphasis.
- `--primary-foreground` / `text-primary-foreground` — text on primary backgrounds.
- `--secondary` / `bg-secondary` — secondary action background.
- `--secondary-foreground` / `text-secondary-foreground` — text on secondary backgrounds.
- `--accent` / `bg-accent` — hover/selected background.
- `--accent-foreground` / `text-accent-foreground` — text on accent backgrounds.
- `--destructive` / `text-destructive`, `bg-destructive/10` — destructive or unsafe state emphasis.

### Sidebar

- `--sidebar` / `bg-sidebar` — sidebar background.
- `--sidebar-foreground` / `text-sidebar-foreground` — sidebar text.
- `--sidebar-accent` / `bg-sidebar-accent` — active/open sidebar state.
- `--sidebar-accent-foreground` / `text-sidebar-accent-foreground` — text on sidebar accent.
- `--sidebar-border` / `border-sidebar-border` — sidebar separators.
- `--sidebar-ring` / `ring-sidebar-ring` — sidebar focus ring.

### Charts and metrics

- `--chart-1` through `--chart-5` — metric/chart colors. Use these for eval dashboards and run metrics before inventing new chart colors.

## Typography tokens

- `--font-sans` — Inter Variable, applied globally to `body` and `html`.
- `--font-heading` — currently maps to `--font-sans`.
- Use `font-heading` only for component headings and card titles when the primitive already expects it.
- Existing page headings use `text-2xl font-bold`.
- Existing card titles use `font-heading text-base font-medium` through `CardTitle`.
- Secondary copy uses `text-sm text-muted-foreground`.

## Radius tokens

Root radius is `--radius: 0.625rem`, expanded through Tailwind tokens:

- `rounded-sm` / `--radius-sm`
- `rounded-md` / `--radius-md`
- `rounded-lg` / `--radius-lg`
- `rounded-xl` / `--radius-xl`
- `rounded-2xl` / `--radius-2xl`
- `rounded-3xl` / `--radius-3xl`
- `rounded-4xl` / `--radius-4xl`

Current primitives favor highly rounded controls:

- Buttons: `rounded-4xl`.
- Cards: `rounded-4xl`.
- Badges: `rounded-3xl`.
- Sidebar avatars/logo: `rounded-lg`.

## Elevation and borders

- Cards use `shadow-md ring-1 ring-foreground/5` with dark-mode `dark:ring-foreground/10`.
- Header uses translucent background: `bg-background/60 backdrop-blur-md border-b`.
- Focus states use `focus-visible:border-ring` and `focus-visible:ring-ring/30` or equivalent primitive defaults.

## State tokens

Map product state to semantic components before adding new colors:

- Success/completed/executed — prefer neutral or primary badge until a success token exists.
- Waiting/pending — prefer `secondary` or `outline` badge.
- Failed/denied/rejected/destructive — use `destructive` variant.
- Disabled/loading — rely on primitive disabled opacity and loading spinner behavior.

If stronger semantic colors become necessary, add tokens to `packages/ui/src/styles/globals.css` first, then document them here. Do not hardcode raw palette classes in product pages.

## Rules

- Use `@agentclave/ui` primitives before composing raw HTML controls.
- Use semantic token classes, not hardcoded hex values or raw Tailwind palette colors.
- Keep dark mode token-compatible. Any added token must define light and `.dark` values.
- Product pages should use `p-6` and tokenized surfaces unless a shared layout component defines otherwise.
- Add new reusable visual patterns to `context/ui-registry.md` after building them.

## Anti-patterns

- Hardcoded hex, RGB, HSL, or OKLCH values outside `packages/ui/src/styles/globals.css`.
- Raw palette classes such as `bg-blue-500`, `text-red-600`, or `border-slate-200` in product pages.
- One-off radius or shadow styles that conflict with the existing rounded card/control system.
- Duplicating UI primitive behavior in `apps/web` when `@agentclave/ui` already provides the component.
