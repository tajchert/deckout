# Stream Deck Profile Builder

Client-side web app for creating Elgato Stream Deck `.streamDeckProfile` files.

## Stack

- **Vite + React 19 + TypeScript** — SPA, no SSR
- **Zustand** — state management
- **JSZip** — browser-side ZIP generation for .streamDeckProfile export
- **JetBrains Mono** — self-hosted in `public/fonts/`
- **Deployment target**: Cloudflare Pages (static)

## Commands

```bash
npm run dev      # Vite dev server
npm run build    # tsc + vite build -> dist/
npm run preview  # Preview production build
```

## Architecture

### Key directories

- `src/lib/` — Pure logic, no React. Types, device definitions, keycodes, action converters, profile builder, ZIP generator.
- `src/store/` — Zustand store + selectors. Single store holds all editor state.
- `src/components/` — React UI. App shell, grid editor, header, page bar.
- `src/components/actions/` — One form component per action type.

### Data flow

1. User interacts with grid/forms → Zustand store updates
2. Store holds **app-level `ActionConfig`** (simple, form-friendly types)
3. On export: `profile-builder.ts` converts store state → **wire-format `ProfileDefinition`** (Elgato's verbose JSON)
4. `zip-generator.ts` assembles the ZIP and triggers browser download

### Supported devices (keys only, no dials)

Mini (3×2), Neo (4×2), MK.2 (5×3), XL (8×4), + (4×2), + XL (6×6), Pedal (3×1), Studio (8×4)

### Supported action types

Hotkey, Open, Website, Text, Multi-Action, Multi-Action Toggle, Navigation, Media

## Profile format

Output is V2 `.streamDeckProfile` — a ZIP archive. See `stream_deck_profile_docs.md` for the full reverse-engineered spec.

Key details:
- Coordinate format is `"col,row"` (column-first, 0-indexed)
- Page folder IDs use custom base32 encoding (see `src/lib/folder-id.ts`)
- `ActionID` can safely be all-zeros

## Design

- Dark theme (`#0a0a0a`) with orange accent (`#ff6b00`)
- Monospaced font throughout (JetBrains Mono)
- CSS custom properties in `src/styles/global.css`
