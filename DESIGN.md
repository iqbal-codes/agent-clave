---
name: AgentClave
description: Governed agent runtime for internal operations.
colors:
  audit-white: "oklch(1 0 0)"
  near-white: "oklch(0.985 0 0)"
  rail-neutral: "oklch(0.97 0 0)"
  border-line: "oklch(0.922 0 0)"
  focus-ring: "oklch(0.708 0 0)"
  muted-evidence: "oklch(0.556 0 0)"
  action-ink: "oklch(0.205 0 0)"
  control-ink: "oklch(0.145 0 0)"
  policy-red: "oklch(0.577 0.245 27.325)"
typography:
  headline:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: "2rem"
    letterSpacing: "normal"
  title:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 500
    lineHeight: "1.5rem"
    letterSpacing: "normal"
  body:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: "1.5rem"
    letterSpacing: "normal"
  label:
    fontFamily: "Inter Variable, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: "1.25rem"
    letterSpacing: "normal"
rounded:
  sm: "6px"
  md: "8px"
  lg: "10px"
  xl: "14px"
  "2xl": "18px"
  "3xl": "22px"
  "4xl": "26px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.action-ink}"
    textColor: "{colors.near-white}"
    rounded: "{rounded.4xl}"
    padding: "0 12px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.rail-neutral}"
    textColor: "{colors.action-ink}"
    rounded: "{rounded.4xl}"
    padding: "0 12px"
    height: "36px"
  input-default:
    backgroundColor: "oklch(0.922 0 0 / 50%)"
    textColor: "{colors.control-ink}"
    rounded: "{rounded.3xl}"
    padding: "4px 12px"
    height: "36px"
  card-default:
    backgroundColor: "{colors.audit-white}"
    textColor: "{colors.control-ink}"
    rounded: "{rounded.4xl}"
    padding: "24px 0"
  badge-default:
    backgroundColor: "{colors.action-ink}"
    textColor: "{colors.near-white}"
    rounded: "{rounded.3xl}"
    padding: "2px 8px"
---

# Design System: AgentClave

## 1. Overview

**Creative North Star: "The Evidence Console"**

AgentClave's interface is an evidence console for governed AI work. Each surface should make the chain of custody visible: issue input, model output, proposed action, policy decision, reviewer action, execution result, trace, and audit record. The system is controlled, transparent, and precise; density is acceptable when it helps a technical reviewer answer the next operational question.

The visual language is restrained product UI, not brand theater. Neutral OKLCH surfaces, Inter typography, rounded control surfaces, concise labels, and structural lift create a calm workspace for approval and inspection. Color is rare and functional: action, focus, selected state, destructive risk, and charts.

AgentClave explicitly rejects decorative SaaS staging. It must not resemble an autonomous coding agent, a multi-agent workflow playground, a generic AI chatbot, or a marketing landing page. Opaque automation, magical AI claims, visual workflow-builder metaphors, glassy marketing surfaces, oversized hero metrics, generic gradient accents, and hidden failure states are forbidden.

**Key Characteristics:**

- Restrained neutral palette with one ink-like primary action color.
- Dense operational hierarchy: page title, concise description, metrics, status, table or approval content.
- Rounded control surfaces that feel approachable without becoming playful.
- Structural lift through rings and soft shadows only where a panel needs to read as inspectable evidence.
- Every state has a visible, textual explanation; color never carries meaning alone.

## 2. Colors

The palette is Control Ink / Audit White: black-white-neutral OKLCH roles tuned for auditability, with a single destructive red for rejected, failed, or policy-denied paths.

### Primary

- **Action Ink**: primary buttons, links, active emphasis, and the RG mark. Use it sparingly so primary actions remain obvious.
- **Control Ink**: foreground text and high-confidence labels. This is the default voice of the product.

### Secondary

- **Policy Red**: destructive or unsafe states: failed runs, rejected actions, denied policy decisions, invalid fields, and destructive controls. It is not decorative and must always be paired with text.

### Neutral

- **Audit White**: app background and card surface at rest.
- **Near White**: text on Action Ink and high-contrast dark surfaces.
- **Rail Neutral**: secondary controls, muted regions, hover backgrounds, sidebar accents, and empty-state panels.
- **Border Line**: dividers, outlines, default input/border affordance, and table separation.
- **Focus Ring**: visible keyboard focus, validation focus, and active control affordance.
- **Muted Evidence**: secondary descriptions, metadata, timestamps, helper text, and low-priority copy.

### Named Rules

**The Evidence Color Rule.** Color marks a decision, affordance, or state; it never decorates a panel that has no operational meaning.

**The Red Requires a Reason Rule.** Policy Red is prohibited unless the same component also names the failure, rejection, denial, invalid input, or destructive action.

## 3. Typography

**Display Font:** Inter Variable with sans-serif fallback.
**Body Font:** Inter Variable with sans-serif fallback.
**Label/Mono Font:** Inter Variable; no separate mono or decorative display face exists yet.

**Character:** The type system is compact and legible. It uses one family across headings, labels, body, buttons, and data so the product reads like an instrument panel, not a brochure.

### Hierarchy

- **Headline** (700, 1.5rem, 2rem): page titles and major authenticated surfaces. Use for Dashboard, Agents, Runs, Approvals, Audit Log, and Settings page titles.
- **Title** (500, 1rem, 1.5rem): card titles, table panel headings, approval card headings, and form section headings.
- **Body** (400, 1rem, 1.5rem): main prose, empty-state explanations, and longer review text. Keep explanatory copy to 65-75ch when it is prose rather than table data.
- **Label** (500, 0.875rem, normal letter-spacing): buttons, field labels, compact metadata, badges, table headers, and form controls.

### Named Rules

**The No Theater Type Rule.** No display fonts, gradient text, oversized marketing headings, or fluid hero typography inside product screens.

**The Evidence Label Rule.** Labels must name the artifact or state directly: Run status, Policy decision, Confidence, Cost, Latency, Reviewer, Execution result.

## 4. Elevation

AgentClave uses structural lift: cards and important panels sit on Audit White with a subtle foreground ring and Tailwind `shadow-md`. Elevation separates reviewable evidence from the background; it is not a decorative glow. Inputs and badges are flatter and depend on tonal fills, borders, and focus rings.

### Shadow Vocabulary

- **Evidence Panel Lift** (`ring: 1px foreground at 5%; shadow-md`): default Card primitive for dashboards, run summaries, policy panels, and approval cards.
- **Dark Evidence Panel Lift** (`ring: 1px foreground at 10%; shadow-md`): dark-mode card equivalent.
- **Control Focus Lift** (`ring: 3px focus-ring at 30%`): keyboard focus and active validation affordance on buttons and inputs.

### Named Rules

**The Lift Must Explain Itself Rule.** A lifted surface must contain inspectable content: metric, run, policy, approval, trace, audit entry, or settings form. Decorative lift is prohibited.

## 5. Components

AgentClave components are rounded control surfaces: familiar, dense, and explicit. They reuse `@agentclave/ui` primitives before local composition.

### Buttons

- **Shape:** pill-like rounded controls using the 4xl radius (26px).
- **Primary:** Action Ink background with Near White text; default height 36px and horizontal padding 12px.
- **Hover / Focus:** hover darkens through token opacity; keyboard focus uses a 3px Focus Ring halo and border shift. Active state moves down 1px for tactile feedback.
- **Secondary / Ghost / Outline:** use Rail Neutral, Audit White, or transparent backgrounds. They must remain visibly subordinate to the primary action.
- **Destructive:** Policy Red text on a red-tinted background. Use only for reject, deny, remove, or unsafe actions.

### Chips

- **Style:** compact 20px-high rounded badges with 3xl radius (22px), 12px text, and explicit variants for default, secondary, destructive, outline, ghost, and link.
- **State:** status badges should pair the visual variant with a readable label. Failed, rejected, denied, or destructive statuses use the destructive variant.

### Cards / Containers

- **Corner Style:** rounded evidence panels using the 4xl radius (26px).
- **Background:** Audit White for cards; Rail Neutral for subdued background regions.
- **Shadow Strategy:** Evidence Panel Lift only. No decorative glow, glass blur, or nested card stack.
- **Border:** a subtle foreground ring substitutes for heavy borders.
- **Internal Padding:** 24px vertical card shell, 24px horizontal content/header padding; compact cards may use 16px horizontal padding.

### Inputs / Fields

- **Style:** 36px-high rounded fields with 3xl radius (22px), transparent border, and a 50% Border Line fill.
- **Focus:** border shifts to Focus Ring and adds a 3px ring at 30% opacity.
- **Error / Disabled:** invalid fields use Policy Red border/ring; disabled fields lower opacity and remove pointer affordance.

### Navigation

- **Style:** authenticated routes live in the existing sidebar shell with the RG mark, workspace label, Lucide icons, and `SidebarMenuButton` active states. The sticky header stays utility-only and does not duplicate page titles.
- **Default / Hover / Active:** default navigation is neutral; active and open states use sidebar accent tokens. Icons remain monochrome and subordinate to the label.
- **Mobile:** keep the shared sidebar behavior; do not create a second dashboard shell.

## 6. Do's and Don'ts

### Do:

- **Do** preserve the evidence chain: input, model output, policy decision, reviewer action, executor result, trace, and audit record.
- **Do** use semantic token classes from `@agentclave/ui` instead of raw palette values in product pages.
- **Do** keep product screens dense, scannable, and explicit; use concise labels and tables where operational review needs them.
- **Do** show denied, failed, rejected, and policy-required states rather than hiding them to keep the UI clean.
- **Do** meet WCAG 2.2 AA with visible focus, non-color-only status, sufficient placeholder contrast, and reduced-motion-safe transitions.

### Don't:

- **Don't** make AgentClave look or behave like an autonomous coding agent, a multi-agent workflow playground, a generic AI chatbot, or a decorative SaaS landing page.
- **Don't** use opaque automation, magical AI claims, visual workflow-builder metaphors, glassy marketing surfaces, oversized hero metrics, generic gradient accents, or UI that hides failure or policy-denied states.
- **Don't** add gradient text, colored side-stripe borders, decorative glassmorphism, repeated icon-card grids, or marketing-style numbered section markers.
- **Don't** hardcode hex, RGB, HSL, OKLCH, or raw Tailwind palette classes in product pages; add tokens first if a new semantic color is required.
- **Don't** create nested cards, a parallel dashboard shell, or one-off controls when an `@agentclave/ui` primitive already exists.
