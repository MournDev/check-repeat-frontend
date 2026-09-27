---
name: 论文查重管理系统
description: 学术论文查重与审核管理平台，面向学生、教师、管理员三种角色
colors:
  primary: "#0066cc"
  primary-hover: "#005bb8"
  primary-focus: "#0071e3"
  canvas: "#f5f5f7"
  surface: "#ffffff"
  ink: "#1d1d1f"
  muted: "#7a7a7a"
  hairline: "#e0e0e0"
  success: "#10b981"
  warning: "#f59e0b"
  danger: "#ef4444"
  info: "#0ea5e9"
typography:
  display:
    fontFamily: "SF Pro Display, Inter, system-ui, -apple-system, sans-serif"
    fontSize: "40px"
    fontWeight: 600
    lineHeight: 1.10
  body:
    fontFamily: "SF Pro Text, Inter, system-ui, -apple-system, sans-serif"
    fontSize: "17px"
    fontWeight: 400
    lineHeight: 1.47
  caption:
    fontFamily: "SF Pro Text, Inter, system-ui, -apple-system, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.43
  label:
    fontFamily: "SF Pro Text, Inter, system-ui, -apple-system, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.0
rounded:
  sm: "5px"
  md: "8px"
  lg: "11px"
  xl: "18px"
  pill: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "17px"
  xl: "24px"
  xxl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "#ffffff"
    rounded: "{rounded.pill}"
    padding: "11px 22px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "{spacing.xl}"
  chip-tag:
    rounded: "{rounded.pill}"
    padding: "4px 12px"
  input:
    rounded: "{rounded.pill}"
    height: "44px"
---

# Design System: 论文查重管理系统

## 1. Overview

**Creative North Star: "The Academic Workbench"**

A restrained product design system optimized for focused task work in academic settings. The interface should feel professional, trustworthy, and efficient — not decorative or playful. Teachers are processing dozens of papers; the design must support high-throughput review without visual fatigue.

The system inherits from Apple's Human Interface Guidelines for its core tactile vocabulary (SF Pro fonts, hairline borders, flat-by-default surfaces, pill-shaped controls) but narrows the scope to product-UI conventions: fixed type scale, dense data tables, and consistent component vocabulary across all role surfaces.

**Key Characteristics:**
- Restrained color: one primary blue accent (#0066cc) on ≤10% of any screen
- Flat by default: hairline borders (1px #e0e0e0), no decorative shadows
- Dense but breathable: 17px body text for readability, tight spacing for data-heavy views
- Single font family: SF Pro across all roles (display/body/caption/label), Inter as cross-platform fallback
- Pill-shaped interactive controls: buttons, inputs, tags use full rounding (9999px)

Explicitly rejects: SaaS marketing clichés, glassmorphism, purple-blue gradients, nested cards, decorative shadows, and all-caps eyebrow labels.

## 2. Colors

The palette is restrained product UI: one primary accent, a warm-adjacent neutral ramp, and four semantic state colors.

### Primary
- **Academic Blue** (#0066cc): Primary actions, selected states, links, active indicators. Used on ≤10% of any screen surface.

### Neutral
- **Canvas** (#f5f5f7): Page background. The foundation surface behind all content.
- **Surface** (#ffffff): Cards, modals, table backgrounds. The working surface.
- **Ink** (#1d1d1f): Primary body text and headings. Never pure black.
- **Muted** (#7a7a7a): Secondary text, captions, placeholder hints. Meets 4.5:1 on white.
- **Hairline** (#e0e0e0): Borders, dividers, table cell separators.

### Semantic
- **Success** (#10b981): Passed, completed, low similarity, positive trends.
- **Warning** (#f59e0b): Pending, medium similarity, attention needed.
- **Danger** (#ef4444): Overdue, high similarity, rejected, delete actions.
- **Info** (#0ea5e9): General information, neutral status indicators.

**The One Voice Rule.** The primary blue accent appears on one element per visual group (a single button, a single selected tab, a single badge). Multiple blue elements in the same card or row dilute the signal into decoration. The rarity is the point.

**The No Pure Black Rule.** Never use #000000 or #ffffff bare. Body text is always `--primary-ink` (#1d1d1f); backgrounds are always `--canvas` or `--surface`; pure white is only used inside inverted-contrast contexts (primary button text on blue).

## 3. Typography

**Display Font:** SF Pro Display, Inter, system-ui, -apple-system, sans-serif
**Body Font:** SF Pro Text, Inter, system-ui, -apple-system, sans-serif
**Label/Mono Font:** (inherits body font; no distinct mono stack)

**Character:** A single sans-serif family at different weights carries the entire hierarchy. Weight contrast (400/600/700) replaces font-pairing contrast. No serif display; this is a product tool, not editorial content.

### Hierarchy
- **Display** (600, 40px, 1.10): Page titles only. One per page.
- **Headline** (600, 34px, 1.47): Section headers in dashboards.
- **Title** (600, 21px, 1.19): Card headers, modal titles.
- **Body** (400, 17px, 1.47): Primary content, table cells, form labels. Max 65-75ch for prose.
- **Caption** (400, 14px, 1.43): Secondary metadata, timestamps, helper text.
- **Label** (400, 12px, 1.0): Badges, tags, fine-print status indicators.

**The Fixed Scale Rule.** Type sizes are fixed rems, not fluid clamp(). Product UI is viewed at consistent DPI; a fluid h1 that shrinks in a sidebar is disorienting, not adaptive. Responsive breakpoints reduce the scale in discrete steps: 40px → 34px → 28px.

## 4. Elevation

This is a **flat-by-default** system. Surfaces rest on the same plane; depth is conveyed through border contrast and background layering, not shadows. All shadows (`box-shadow`) are set to `none` globally. The one permitted shadow (`--apple-shadow-product: 3px 5px 30px 0 rgba(0,0,0,0.22)`) is reserved for rare product-hero moments and is not used in the teacher dashboard.

**The Flat-By-Default Rule.** Surfaces are flat at rest. Borders alone distinguish cards from backgrounds. Hover states shift border color slightly (e0e0e0 → d0d0d0) without elevating.

## 5. Components

### Buttons
- **Shape:** Full pill (9999px radius)
- **Primary:** Blue background (#0066cc), white text, 11px 22px padding, 17px font
- **Hover:** Darker blue (#005bb8), no lift, no shadow
- **Active:** Scale(0.95) for tactile feedback, no translate
- **Secondary:** Canvas background (#f5f5f7) with hairline border, ink text
- **Ghost/Text:** Transparent background, muted text, canvas background on hover

### Cards
- **Corner Style:** 18px radius
- **Background:** White surface (#ffffff)
- **Border:** 1px hairline (#e0e0e0)
- **Shadow:** None
- **Internal Padding:** 24px

### Chips / Tags
- **Style:** Pill shape (9999px), 4px 12px padding, 12px font, 400 weight
- **Color variants:** Tinted background + saturated text for semantic states (success/warning/danger/info)

### Inputs
- **Style:** Pill shape (9999px), 44px height, hairline border
- **Focus:** 2px solid #0071e3 outline with -2px offset, border-color transparent
- **Hover:** Border shifts to #d0d0d0

### Tables
- **Style:** 14px font, hairline cell borders (#f0f0f0), white background
- **Header:** Canvas background (#f5f5f7), 14px semi-bold, muted color text
- **Row hover:** Canvas background (#f5f5f7)

### Navigation
- **Sidebar:** Fixed left, canvas background, no right border
- **Active item:** Primary blue text with 6% opacity blue background
- **Mobile:** Collapses to bottom tab bar with 3-4 primary destinations

## 6. Do's and Don'ts

### Do:
- **Do** reference design tokens via CSS variables: `var(--apple-primary)`, `var(--apple-canvas)`, etc.
- **Do** use the shared `.card`, `.btn`, `.tag`, `.input` utility classes where applicable
- **Do** keep cards flat — hairline border only, no shadow
- **Do** use pill-shaped buttons and inputs (9999px radius)
- **Do** limit primary blue to one element per visual group
- **Do** use fixed rem sizes for type, not fluid clamp()

### Don't:
- **Don't** hard-code colors in component scoped styles; use design tokens
- **Don't** use `border-left` or `border-right` greater than 1px as a colored accent stripe
- **Don't** pair `border: 1px solid` with `box-shadow` on the same element
- **Don't** use pure black (#000000) or pure white (#ffffff) for text or backgrounds
- **Don't** use `border-radius: 32px+` on cards; 18px is the maximum
- **Don't** nest cards inside cards
- **Don't** use bounce, elastic, or spring easing for UI transitions
- **Don't** use gradient text or glassmorphism effects
- **Don't** use SaaS landing-page clichés: hero metrics, gradient accents, identical card grids with icon+heading+text
- **Don't** apply decorative motion or orchestrated page-load animations