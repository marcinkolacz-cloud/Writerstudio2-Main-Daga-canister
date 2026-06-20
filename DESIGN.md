# Design Brief

## Direction

WriterStudio TipTap — a focused writing environment for authors and editors. Dark-first editorial aesthetic with warm amber accents on deep charcoal.

## Tone

Warm editorial minimalism: refined, focused, and inviting — like a premium notebook app that respects the writer's attention.

## Differentiation

Deep warm charcoal background with amber primary accents avoids the cold blue-grey cliche of every other writing app.

## Color Palette

| Token      | OKLCH         | Role                         |
| ---------- | ------------- | ---------------------------- |
| background | 0.14 0.015 50 | deep warm charcoal (base)    |
| foreground | 0.92 0.01 60  | warm cream (text)            |
| card       | 0.18 0.018 50 | elevated surfaces            |
| primary    | 0.72 0.17 70  | warm amber (CTA, active)     |
| accent     | 0.58 0.14 25  | dusty coral (highlights)     |
| muted      | 0.22 0.02 50  | sidebar, secondary surfaces  |

## Typography

- Display: Space Grotesk — headings, logo, page titles
- Body: DM Sans — UI labels, form text, sidebar items
- Mono: JetBrains Mono — code, stats, metadata
- Scale: hero `text-4xl font-bold tracking-tight`, h2 `text-2xl font-semibold`, label `text-sm font-medium tracking-wide`, body `text-base`

## Elevation & Depth

Card surfaces at `bg-card` with `shadow-subtle` for forms and modals. Sidebar at `bg-muted` with `border-r`. No full-page gradients.

## Structural Zones

| Zone    | Background      | Border        | Notes                              |
| ------- | --------------- | ------------- | ---------------------------------- |
| Top bar | bg-card         | border-b      | logo left, minimal height 56px     |
| Sidebar | bg-muted        | border-r      | 240px fixed, chapter list placeholder|
| Content | bg-background   | —             | main writing/dashboard area        |
| Login   | bg-background   | —             | centered card with shadow-elevated |

## Spacing & Rhythm

- Section gaps: 24px–32px
- Content padding: 24px
- Sidebar item spacing: 12px
- Micro spacing: 4px / 8px / 12px / 16px scale

## Component Patterns

- Buttons: `rounded-md`, `bg-primary`, `text-primary-foreground`, hover `brightness-110`, `transition-smooth`
- Cards: `rounded-lg`, `bg-card`, `shadow-subtle`, `border`
- Inputs: `rounded-md`, `bg-input`, `border`, focus `ring-2 ring-ring`

## Motion

- Entrance: `animate-fade-in` on page content, 0.4s ease
- Hover: `transition-smooth` on buttons and links
- Sidebar: `animate-slide-in-left` on first render

## Constraints

- Dark mode only (no light mode toggle needed)
- No gradients on backgrounds
- Max 3 font families
- Accent color used sparingly for highlights and active states

## Signature Detail

Warm amber primary on deep charcoal creates a cozy, focused writing atmosphere — the UI disappears so the words can breathe.
