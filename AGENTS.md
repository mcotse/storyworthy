# AGENTS.md - AI Assistant Guide

> This file helps AI coding assistants understand the Storyworthy project.
> Last updated: Auto-generated on each push

## Project Overview

**Storyworthy** is a Progressive Web App (PWA) for daily journaling. Users capture "storyworthy moments" and gratitude entries, with optional photo attachments.

- **Live URL:** https://mcotse.github.io/storyworthy/
- **Platform:** PWA optimized for mobile (especially iPhone)
- **Storage:** All data stored locally in IndexedDB (no backend)

## Tech Stack

| Technology | Purpose |
|------------|---------|
| React 19 | UI framework |
| TypeScript | Type safety |
| Vite | Build tool |
| vite-plugin-pwa | PWA/Service Worker |
| Zustand | State management |
| IndexedDB | Local data storage |
| date-fns | Date utilities |
| browser-image-compression | Photo compression |

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── EntryCard.tsx    # Entry display card (expandable)
│   ├── EntryForm.tsx    # Create/edit entry form
│   ├── Navigation.tsx   # Bottom tab navigation
│   ├── Onboarding.tsx   # First-time user flow
│   ├── PhotoModal.tsx   # Full-screen photo viewer
│   ├── PhotoUpload.tsx  # Photo capture with compression
│   ├── SearchBar.tsx    # Entry search
│   └── Toast.tsx        # Toast notifications
├── pages/               # Main app views
│   ├── Home.tsx         # Entry list
│   ├── Calendar.tsx     # Monthly calendar
│   ├── Analytics.tsx    # Stats and insights
│   ├── Random.tsx       # Random memory viewer
│   └── Settings.tsx     # App settings
├── services/            # Business logic
│   ├── db.ts            # IndexedDB operations
│   ├── compression.ts   # Image compression
│   └── notifications.ts # Web notifications
├── store/
│   └── index.ts         # Zustand store
├── types/
│   └── entry.ts         # TypeScript interfaces
├── utils/
│   ├── date.ts          # Date helpers, streak calc
│   └── export.ts        # Import/export JSON
├── App.tsx              # Main app component
├── main.tsx             # Entry point
└── index.css            # Global styles & design system
```

## Key Data Types

```typescript
interface Entry {
  date: string;          // "YYYY-MM-DD" (primary key)
  storyworthy: string;   // Main journal entry
  thankful: string;      // Gratitude entry
  photo?: string;        // Base64 compressed image
  thumbnail?: string;    // 60x60 thumbnail
  createdAt: number;     // Unix timestamp
  modifiedAt?: number;   // Unix timestamp
}
```

## Design System

### Colors
- Primary: `#D4A59A` (muted terracotta)
- Primary Dark: `#C4887A` (CTAs)
- Background: `#FAF8F5` (soft beige)
- Text: `#3A3A3A` (warm dark gray)

### Typography
- Body: DM Sans (Google Font)
- Headings: DM Serif Display (used sparingly, h1 only)
- Entry content: DM Serif Display

### CSS Variables
All design tokens are in `src/index.css` as CSS custom properties:
- `--color-*` for colors
- `--spacing-*` for spacing (xs, sm, md, lg, xl, xxl)
- `--radius-*` for border radius
- `--shadow-*` for shadows

## State Management

Using Zustand with persist middleware. Key state:
- `entries: Entry[]` - All journal entries
- `activeTab` - Current navigation tab
- `searchQuery` / `searchResults` - Search state
- `notificationSettings` - Reminder preferences

## Important Patterns

### IndexedDB Operations
All DB operations are in `src/services/db.ts`. Always use async/await:
```typescript
import { getEntry, createEntry } from './services/db';
const entry = await getEntry('2024-01-15');
```

### Photo Handling
Photos are compressed to max 500KB before storing:
```typescript
import { compressAndCreateThumbnail } from './services/compression';
const { photo, thumbnail } = await compressAndCreateThumbnail(file);
```

### Type-Only Imports
Use `import type` for TypeScript types:
```typescript
import type { Entry } from '../types/entry';
```

## Commands

```bash
bun install          # Install dependencies
bun run dev          # Start dev server (http://localhost:5173)
bun run build        # Production build
bun run preview      # Preview production build
bun run test:run     # Run unit tests
bun run test:e2e     # Run Playwright e2e tests (headless)
bun run test:e2e:ui  # Run e2e tests with interactive UI
```

## Testing Requirements

**IMPORTANT: Run e2e tests after major changes!**

After implementing any of the following, run `bun run test:e2e` before committing:
- New features or pages
- Changes to navigation or routing
- Modifications to entry creation/editing flow
- Updates to onboarding
- Changes to search functionality
- Any UI changes that affect user workflows

The e2e tests cover: onboarding, navigation, entry CRUD, search, and settings.

## Deployment

- Hosted on GitHub Pages
- Auto-deploys via `.github/workflows/deploy.yml` on push to main
- Base URL: `/storyworthy/`

## Git Workflow

- Commit changes directly without asking for permission
- Push when asked or when a feature is complete

## Versioning

Version in `package.json` is auto-exposed via `__APP_VERSION__` global.

- **Patch** (1.0.x): Bug fixes, small tweaks
- **Minor** (1.x.0): New features
- **Major** (x.0.0): Breaking changes

## Common Tasks

### Adding a new page
1. Create `src/pages/NewPage.tsx` and `.module.css`
2. Add tab to `src/components/Navigation.tsx`
3. Add case to `renderPage()` in `src/App.tsx`
4. Update `activeTab` type in `src/store/index.ts`

### Adding a new component
1. Create `src/components/Component.tsx` and `.module.css`
2. Use CSS modules: `import styles from './Component.module.css'`

### Modifying the database schema
1. Update interface in `src/types/entry.ts`
2. Increment `DB_VERSION` in `src/services/db.ts`
3. Handle migration in `onupgradeneeded`

## File Structure (Auto-Generated)

<!-- BEGIN_FILE_TREE -->
```
.claude/settings.local.json
.github/workflows/deploy.yml
.github/workflows/update-agents.yml
.mcp.json
AGENTS.md
CLAUDE.md
README.md
SPEC.md
browser-tests/run-tests.ts
e2e/entries.spec.ts
e2e/helpers.ts
e2e/missing-days.spec.ts
e2e/navigation.spec.ts
e2e/onboarding.spec.ts
e2e/search.spec.ts
e2e/settings.spec.ts
index.html
package.json
playwright.config.ts
scripts/convert-csv.ts
src/App.tsx
src/components/EntryCard.module.css
src/components/EntryCard.test.tsx
src/components/EntryCard.tsx
src/components/EntryForm.module.css
src/components/EntryForm.tsx
src/components/Navigation.module.css
src/components/Navigation.tsx
src/components/Onboarding.module.css
src/components/Onboarding.tsx
src/components/PhotoModal.module.css
src/components/PhotoModal.tsx
src/components/PhotoUpload.module.css
src/components/PhotoUpload.tsx
src/components/SearchBar.module.css
src/components/SearchBar.tsx
src/components/Toast.module.css
src/components/Toast.tsx
src/components/UpdatePrompt.module.css
src/components/UpdatePrompt.tsx
src/index.css
src/main.tsx
src/pages/Analytics.module.css
src/pages/Analytics.tsx
src/pages/Calendar.module.css
src/pages/Calendar.tsx
src/pages/Home.module.css
src/pages/Home.tsx
src/pages/Random.module.css
src/pages/Random.tsx
src/pages/Settings.module.css
src/pages/Settings.tsx
src/services/auth.ts
src/services/compression.ts
src/services/db.ts
src/services/notifications.ts
src/services/supabase.ts
src/services/sync.ts
src/store/index.test.ts
src/store/index.ts
src/test/setup.ts
src/types/entry.ts
src/utils/date.test.ts
src/utils/date.ts
src/utils/export.test.ts
src/utils/export.ts
src/vite-env.d.ts
tsconfig.app.json
tsconfig.json
tsconfig.node.json
vite.config.ts
vitest.config.ts
```
<!-- END_FILE_TREE -->
