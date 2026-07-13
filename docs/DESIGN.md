# UI Design System Reference

## Metadata
- **Title**: UI Design System Reference - Job Monitor Platform
- **Purpose**: Specifies colors, typography, theme tokens, layout rules, and component-specific styles for the client application.
- **Last Updated**: 2026-07-13
- **Current Version**: v5.0.0
- **Cross-References**: [TECH_STACK.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/TECH_STACK.md), [ARCHITECTURE.md](file:///c:/Users/varun/Downloads/Job%20Monitor/docs/ARCHITECTURE.md)

---

## Table of Contents
1. [Theme & Aesthetic Direction](#theme--aesthetic-direction)
2. [Color Palette](#color-palette)
3. [Typography](#typography)
4. [Spacing & Layout Rules](#spacing--layout-rules)
5. [Border Radius & Elevation](#border-radius--elevation)
6. [Responsive Breakpoints](#responsive-breakpoints)
7. [Component Styles](#component-styles)
8. [Animations & Transitions](#animations--transitions)
9. [Design Dos and Don'ts](#design-dos-and-donts)
10. [Future UI Improvements](#future-ui-improvements)

---

## Theme & Aesthetic Direction

The Job Monitor Platform client interface utilizes a **rich, dark, glassmorphic UI design**. The visual layout feels reactive, modern, and high-fidelity. By blending semi-transparent layers, thin borders, and vibrant accents, the interface delivers a premium developer-focused SaaS experience.

---

## Color Palette

The design tokens are declared as global CSS custom properties in [index.css](file:///c:/Users/varun/Downloads/Job%20Monitor/frontend/src/index.css):

| CSS Custom Variable | Token Color | Description |
| :--- | :--- | :--- |
| `--bg-primary` | `#0b0f19` | Main page background (deep navy-black) |
| `--bg-secondary` | `#131a26` | Card, container, and sidebar background |
| `--bg-tertiary` | `#1b2535` | Tooltip and inner component wrapper background |
| `--accent` | `#4f46e5` | Core brand theme color (Indigo) |
| `--accent-light` | `#818cf8` | Hover indicator state accent |
| `--border` | `#232d3f` | Thin border rules and separators |
| `--text-primary` | `#f8fafc` | Dominant text color (slate-50) |
| `--text-secondary` | `#94a3b8` | Subtext and placeholder text (slate-400) |
| `--success` | `#10b981` | Emerald green representing "Applied/Match" |
| `--warning` | `#f59e0b` | Amber gold indicating "Recommendations/Pending" |
| `--danger` | `#ef4444` | Crimson red indicating "Rejected/Failures" |
| `--color-primary` | `#7c3aed` | Secondary accent brand color (Purple) |

---

## Typography

- **Primary Font Family**: `'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`
- **Fallback Font Families**: System default UI sans-serif structures.
- **Hierarchy Scale**:
  - **Main Headings (`h1`)**: `font-size: 1.875rem (30px)`, `font-weight: 700`
  - **Section Sub-Headings (`h2`)**: `font-size: 1.5rem (24px)`, `font-weight: 600`
  - **Module Titles (`h3`)**: `font-size: 1.25rem (20px)`, `font-weight: 600`
  - **Body Text**: `font-size: 0.875rem (14px)` or `1rem (16px)`, `font-weight: 400`
  - **Metadata & Labels**: `font-size: 0.75rem (12px)`, `font-weight: 500`

---

## Spacing & Layout Rules

The spacing system relies on standard Tailwind CSS fractional multipliers:
- **Base Grid**: 4px unit constraints (`1rem = 16px`).
- **Inner Padding**: `p-4 (16px)` or `p-6 (24px)` inside dashboard cards and sidebar panels.
- **Flex Gap**: `gap-4 (16px)` or `gap-6 (24px)` to space card items grid-wise.
- **Container Margins**: `mb-6 (24px)` to separate structural layout blocks.

---

## Border Radius & Elevation

- **Borders**: Fixed `1px solid var(--border)` configuration across layout blocks.
- **Border Radius**:
  - Small Elements (Badges, Buttons): `rounded-md` or `rounded-lg` (6px to 8px).
  - Main Cards, Sidebars, and Modals: `rounded-xl` or `rounded-2xl` (12px to 16px).
- **Elevation / Shadow**: Subtle glows and offsets rather than muddy gray drop shadows:
  - Custom glass-shadow style: `box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);`
  - Backdrop blur filter rules: `backdrop-filter: blur(12px);`

---

## Responsive Breakpoints

Layout grids must adjust across responsive breakpoints using Tailwind responsive prefixes:
- **Mobile (`sm:`)**: `640px` width threshold. Gaps drop to 8px, flex columns stack.
- **Tablet (`md:`)**: `768px` width threshold. Sidebars collapse to icon-only drawers.
- **Desktop (`lg:`)**: `1024px` width threshold. Main layout displays columns side-by-side.
- **Large Screen (`xl:`)**: `1280px` width threshold.

---

## Component Styles

### Buttons
- **Primary Action**: Brand purple/indigo base, hover scaling animation.
- **Secondary Action**: Border style, subtle background opacity increases on hover.
- **Delete / Danger Action**: Dark red borders with light red text highlights.

### Inputs
- **Base Style**: `bg-opacity-50` dark backdrops, custom slate borders.
- **Focus State**: `border-indigo-500` with subtle glow ring triggers.

### Cards
- **Structure**: Glassmorphic panels using thin borders and slate backgrounds (`bg-[#131a26]`).
- **Activity Feed**: Alternating opacity highlights, custom rounded corners.

### Tables
- **Grid Layout**: Header rows in deep navy-black (`bg-[#0b0f19]`), borders separating rows.
- **Interactive Rows**: Scale up slightly on hover.

### Modals
- **Backdrop Overlay**: Dark overlays (`bg-black/60` with `backdrop-blur-md`).
- **Container**: Elevated containers, center-aligned, with close controls.

### Sidebar & Navigation
- **Sidebar**: Fixed on left, logo at top, active tabs highlighted with brand indigo backdrops.
- **Header**: Sticky headers, search bar, active user profile avatar.

---

## Animations & Transitions

- **Core Transitions**: All hover and scale modifications must use `transition-all duration-300 ease-in-out` rules.
- **Card Hover Elevation**: Cards scale up by 2% on hover:
  ```css
  .hover-card:hover {
    transform: translateY(-2px) scale(1.02);
    border-color: var(--accent-light);
  }
  ```
- **Loader States**: Use pulse skeleton loaders (`animate-pulse`) for cards during query fetches.

---

## Design Dos and Don'ts

### Dos:
- **Do** use semantic colors (`--success` for matches, `--danger` for rejections).
- **Do** ensure all clickable elements have explicit hover state feedback.
- **Do** write clean, flex/grid structures that scale down to mobile screen viewports.

### Don'ts:
- **Don't** use standard default raw primary colors (like `#ff0000` or `#0000ff`). Use the defined CSS variables.
- **Don't** add arbitrary margins that break container vertical alignments.
- **Don't** hardcode layouts to fixed widths, which breaks responsiveness.

---

## Future UI Improvements

1. **Light/Dark Toggle**: Support adaptive system-based light/dark theme variables.
2. **Custom Theme Builder**: Allow candidates to customize brand colors (e.g. emerald theme instead of indigo).
3. **Interactive Charts**: Transition static analytics listings into animated canvas charts (via Recharts).
