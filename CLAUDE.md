# CLAUDE.md - Claude Code Guide

This file provides context for Claude Code when working on the Daily Moments project.

## Quick Start

```bash
npm install        # Install deps + git hooks
npm run dev        # Start dev server (http://localhost:5174/storyworthy/)
npm run test:run   # Run unit tests
npm run build      # Type check + production build
```

## Testing

### Unit Tests (Vitest)
```bash
npm run test       # Watch mode
npm run test:run   # Single run
npm run test:coverage
```

Test files:
- `src/components/EntryCard.test.tsx` - Component tests
- `src/store/index.test.ts` - State management tests
- `src/utils/date.test.ts` - Date utility tests
- `src/utils/export.test.ts` - Export/import tests

Test utilities are set up in `src/test/setup.ts` with mocks for:
- IndexedDB
- matchMedia
- Notification API
- navigator.storage

### Browser Tests (dev-browser)
```bash
# Requires dev-browser server running
npm run test:browser
```

Browser tests are in `browser-tests/run-tests.ts` and test:
- Onboarding flow
- Navigation between all pages
- Entry creation and editing
- Search functionality
- Calendar entry indicators

## Pre-commit Hooks

Hooks run automatically on commit:
1. TypeScript type checking
2. Unit tests

To reinstall hooks: `./scripts/install-hooks.sh`

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                        App.tsx                          │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Onboarding (if new user)            │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │   Pages: Home | Calendar | Analytics | Random    │   │
│  │          Settings                                │   │
│  └─────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Navigation (bottom tabs)            │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
         │                          │
         ▼                          ▼
┌─────────────────┐      ┌─────────────────────┐
│  Zustand Store  │      │     IndexedDB       │
│  (store/index)  │◄────►│   (services/db)     │
└─────────────────┘      └─────────────────────┘
```

## Data Flow

1. **Entry Creation**: `EntryForm` → `store.createOrUpdateEntry()` → `db.createEntry()` → IndexedDB
2. **Entry Loading**: `App` init → `store.loadEntries()` → `db.getEntries()` → IndexedDB
3. **Search**: `SearchBar` → `store.setSearchQuery()` → filters entries in memory

## Key Files

| File | Purpose |
|------|---------|
| `src/store/index.ts` | All app state and actions |
| `src/services/db.ts` | IndexedDB CRUD operations |
| `src/types/entry.ts` | Entry interface definition |
| `src/index.css` | Design system (CSS variables) |

## Patterns to Follow

### CSS Modules
```tsx
import styles from './Component.module.css';
<div className={styles.container}>
```

### Type-only imports
```tsx
import type { Entry } from '../types/entry';
```

### Store usage
```tsx
import { useStore } from '../store';
const entries = useStore((state) => state.entries);
const createEntry = useStore((state) => state.createOrUpdateEntry);
```

### IndexedDB operations
```tsx
import { getEntry, createEntry } from '../services/db';
const entry = await getEntry('2024-01-15');
```

## Common Modifications

### Add new page
1. Create `src/pages/NewPage.tsx` + `.module.css`
2. Add tab in `src/components/Navigation.tsx`
3. Add case in `App.tsx` `renderPage()`
4. Update `Tab` type in `src/store/index.ts`

### Add new entry field
1. Update `Entry` interface in `src/types/entry.ts`
2. Increment `DB_VERSION` in `src/services/db.ts`
3. Update `EntryForm.tsx` with new field
4. Update `EntryCard.tsx` to display it

### Add new test
```tsx
// src/components/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { NewComponent } from './NewComponent';

describe('NewComponent', () => {
  it('renders correctly', () => {
    render(<NewComponent />);
    expect(screen.getByText('expected text')).toBeInTheDocument();
  });
});
```

## Environment

- **Base URL**: `/storyworthy/` (for GitHub Pages)
- **Dev server**: Vite on port 5173 (or next available)
- **Build output**: `dist/`

## Git Workflow

- Commit changes directly without asking for permission
- Push when asked or when a feature is complete
- Use descriptive commit messages with bullet points for multiple changes

## Don't Do

- Don't add backend dependencies (app is offline-first)
- Don't store sensitive data (all data is local, unencrypted)
- Don't break PWA offline functionality
- Don't modify generated files in `dist/`
