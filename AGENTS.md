# AGENTS.md - AI Assistant Guide

> This file helps AI coding assistants understand the Daily Moments project.
> Last updated: Auto-generated on each push

## Project Overview

**Daily Moments** is a Progressive Web App (PWA) for daily journaling. Users capture "storyworthy moments" and gratitude entries, with optional photo attachments.

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
- UI: System sans-serif
- Entry content: Georgia (serif)

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
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Production build
npm run preview  # Preview production build
```

## Deployment

- Hosted on GitHub Pages
- Auto-deploys via `.github/workflows/deploy.yml` on push to main
- Base URL: `/storyworthy/`

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
.github/workflows/deploy.yml
.gitignore
AGENTS.md
README.md
SPEC.md
index.html
package.json
src/App.tsx
src/components/EntryCard.module.css
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
src/services/compression.ts
src/services/db.ts
src/services/notifications.ts
src/store/index.ts
src/types/entry.ts
src/utils/date.ts
src/utils/export.ts
tsconfig.json
vite.config.ts
```
<!-- END_FILE_TREE -->
