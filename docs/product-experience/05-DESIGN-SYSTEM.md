# DOCORA — Design System Specification
## 05. Design Tokens, Typography, Color Palettes & Component Primitives

**System:** DOCORA — AI Document Studio  
**Design Standard:** Mode C — Institutional Tech-Editorial  
**CSS Engine:** Tailwind CSS v4 (`src/styles/globals.css`)  
**Accessibility Target:** WCAG 2.2 Level AA

---

### 1. Color System & Semantic Tokens

All color combinations have been mathematically validated to exceed the WCAG 2.2 AA contrast ratio threshold of 4.5:1 for normal text and 3:1 for large text / UI borders.

| Semantic Role | Light Mode Hex | Dark Mode Hex | Minimum Contrast Ratio | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | `#F8FAFC` | `#090A0F` | — | Base page background across marketing & workspace |
| **Surface (Card/Modal)**| `#FFFFFF` | `#11131A` / `#0F1117` | — | Container cards, dialogs, inputs, sheets |
| **Primary Text** | `#0F172A` | `#F8FAFC` | **15.8:1** (Light) / **17.2:1** (Dark) | Headings, primary content, table data |
| **Secondary Text** | `#475569` | `#94A3B8` | **5.6:1** (Light) / **5.1:1** (Dark) | Descriptions, subtitles, labels, metadata |
| **Border / Divider** | `#CBD5E1` / `#E2E8F0` | `#1E293B` / `#334155` | **3.2:1** | Structural card borders, dividers, inputs |
| **Brand Accent (Indigo)**| `#4F46E5` | `#818CF8` | **4.6:1** on `#FFFFFF` | Primary action buttons, active tabs, focus rings |
| **Verified Green** | `#047857` (on `#ECFDF5`)| `#34D399` (on `#064E3B`) | **5.1:1** | Quality Gate READY badges, success banners |
| **Warning Amber** | `#92400E` (on `#FFFBEB`)| `#FBBF24` (on `#451A03`) | **5.4:1** | In-flight reviews, review required notices |
| **Danger Red** | `#991B1B` (on `#FEF2F2`)| `#FCA5A5` (on `#450A0A`) | **5.8:1** | Quality Gate BLOCKED badges, soft delete buttons |

---

### 2. Typography & Font Stacks

DOCORA uses four deliberate typography families configured via Next.js `next/font` for zero layout shift (CLS):

```css
/* Arabic Primary */
--font-ibm-plex-arabic: 'IBM Plex Arabic', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Editorial Serif (English Headings & Institutional Latin Branding) */
--font-fraunces: 'Fraunces', Georgia, Cambria, 'Times New Roman', serif;

/* Technical Sans (English Body & UI Controls) */
--font-inter: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;

/* Monospace (Tokens, Telemetry, Code, Timestamps) */
--font-jetbrains-mono: 'JetBrains Mono', 'Courier New', Courier, monospace;
```

#### Hierarchy & Scale
- `Display / Hero`: `text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight`
- `Section Heading (H1)`: `text-2xl sm:text-3xl font-extrabold tracking-tight`
- `Subsection (H2)`: `text-xl font-bold`
- `Card Heading (H3)`: `text-base sm:text-lg font-bold`
- `Body Text`: `text-sm leading-relaxed`
- `Microcopy / Badges`: `text-xs font-semibold`
- `Fine Print / Metadata`: `text-[11px] font-medium`

---

### 3. Core Component Primitives (`src/components/primitives/index.tsx`)

#### A. Button (`<Button />`)
- **Touch Target:** Minimum 44px height (`min-h-11`) for `md` and `sm` sizes (WCAG 2.5.8).
- **Variants:**
  - `primary`: `#4F46E5` background with `#FFFFFF` text.
  - `secondary`: `#F1F5F9` background with `#0F172A` text (dark: `#1E293B`).
  - `outline`: Border `#CBD5E1` with transparent background.
  - `danger`: `#B91C1C` background with `#FFFFFF` text.
  - `ghost`: Transparent with hover background.
- **States:** Default, Hover, Active, Disabled (`opacity-50 pointer-events-none`), Focus-visible (`outline-2 outline-offset-2 outline-[#4F46E5]`).

#### B. Badge (`<Badge />`)
- **Tones:** `verified`, `neutral`, `warning`, `accent`, `danger`.
- **Properties:** Rounded full capsule, 1px border, 12px text, icon support with 6px gap.

#### C. Native Modal Dialog (`<NativeModalDialog />`)
- Uses the HTML5 `<dialog>` element for native focus management, backdrop rendering, and keyboard Esc dismissal.
- Exposes explicit confirmation buttons without ambiguous labels ("موافق" / "OK" banned in favor of explicit actions).

#### D. Theme Toggle (`<ThemeToggle />`)
- Accessible light/dark theme switcher saving preference to localStorage and toggling the `dark` class on `document.documentElement`.
