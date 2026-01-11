# Storyworthy Architecture

## Overview

Storyworthy is an offline-first Progressive Web App (PWA) for daily journaling with optional cloud sync. Built with React, TypeScript, and Zustand for state management.

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              App.tsx                                     │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  Initialization: initDB → loadEntries → initAuth → scheduleNotifs │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │   Pages: Home | Calendar | Analytics | History | Settings       │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │              Navigation (bottom tabs)                            │    │
│  └─────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
         │                          │                          │
         ▼                          ▼                          ▼
┌─────────────────┐      ┌─────────────────────┐      ┌─────────────────┐
│  Zustand Store  │◄────►│     IndexedDB       │      │    Supabase     │
│  (State Mgmt)   │      │   (Local Storage)   │      │  (Cloud Sync)   │
└─────────────────┘      └─────────────────────┘      └─────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| State | Zustand (with persist middleware) |
| Local DB | IndexedDB |
| Cloud | Supabase (Auth, Database, Storage) |
| Styling | CSS Modules |
| Icons | Heroicons |
| Dates | date-fns |
| Testing | Vitest + Playwright |

---

## Pages & Routes

```
┌──────────────────────────────────────────────────────────────────┐
│                         Navigation                                │
├──────────┬──────────┬───────────┬──────────┬────────────────────┤
│   Home   │ Calendar │ Analytics │ History  │     Settings       │
├──────────┴──────────┴───────────┴──────────┴────────────────────┤
│                                                                   │
│  Home          Calendar         Analytics    History   Settings  │
│  ├ Missing     ├ Month grid     ├ Streaks   ├ Search   ├ Notifs │
│  │  entries    ├ Day indicators ├ Time of   ├ Entry    ├ Sync   │
│  ├ Random      └ Create/edit      day dist    list    ├ Export  │
│  │  memory                      └ Word                 ├ Import  │
│  └ Entry                          cloud                └ Storage │
│    cards                                                          │
└──────────────────────────────────────────────────────────────────┘
```

| Page | File | Purpose |
|------|------|---------|
| **Home** | `src/pages/Home.tsx` | Dashboard: missed entries (configurable days) + random memory |
| **Calendar** | `src/pages/Calendar.tsx` | Monthly view with entry indicators |
| **Analytics** | `src/pages/Analytics.tsx` | Streaks, time distribution, word cloud |
| **History** | `src/pages/History.tsx` | Searchable chronological entry list |
| **Settings** | `src/pages/Settings.tsx` | Notifications, sync, data management |

---

## Data Model

```typescript
// src/types/entry.ts

Entry {
  date: string              // YYYY-MM-DD (Primary Key)
  storyworthy: string       // Main journal text
  thankful: string          // Gratitude note
  photo?: string            // Base64 compressed image
  thumbnail?: string        // 60x60px preview
  createdAt: number         // Unix timestamp
  modifiedAt?: number       // Unix timestamp

  // Cloud sync metadata
  cloudId?: string          // Supabase UUID
  photoUrl?: string         // Supabase Storage URL
  thumbnailUrl?: string
  syncedAt?: number
  pendingSync?: boolean     // Needs cloud sync
}

NotificationSettings {
  morningEnabled: boolean
  morningTime: string       // HH:mm
  eveningEnabled: boolean
  eveningTime: string       // HH:mm
}
```

---

## State Management (Zustand)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Zustand Store                             │
│                      src/store/index.ts                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Entry State                    UI State                         │
│  ├ entries: Entry[]             ├ activeTab                      │
│  ├ isLoading: boolean           ├ expandedCardDate               │
│  ├ error: string | null         ├ toasts: Toast[]                │
│  │                              ├ onboardingComplete              │
│  │                              └ missedDaysLimit                 │
│  Search State                                                    │
│  ├ searchQuery: string          Auth & Sync State                │
│  ├ searchResults: Entry[]       ├ user: User | null              │
│  │                              ├ authLoading                     │
│  │                              ├ isSyncing                       │
│  Random State                   ├ lastSyncTime                   │
│  └ randomHistory: string[]      └ isOnline                       │
│                                                                  │
│  Settings                                                        │
│  ├ notificationSettings                                          │
│  └ installPromptDismissedAt                                      │
│                                                                  │
├─────────────────────────────────────────────────────────────────┤
│  Persisted to localStorage:                                      │
│  notificationSettings, onboardingComplete, randomHistory,        │
│  installPromptDismissedAt, missedDaysLimit                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## Services Layer

### Database Service (`src/services/db.ts`)

```
IndexedDB: daily-moments-db
├── entries store (indexed by date)
└── drafts store (auto-save)

Operations:
├── createEntry(entry)
├── getEntry(date)
├── getAllEntries()
├── updateEntry(date, updates)
├── deleteEntry(date)
├── searchEntries(query)
├── getEntriesInRange(start, end)
├── saveDraft(date, draft)
├── getDraft(date)
├── clearDraft(date)
└── getStorageUsage()
```

### Sync Service (`src/services/sync.ts`)

```
Supabase Integration:
├── Tables: entries (RLS protected)
├── Storage: photos bucket
│
├── pushEntry(entry)    → Upload to cloud
├── pullEntries(since)  → Download changes
├── syncAll()           → Bidirectional sync
├── uploadPhoto()       → Photo to Storage
└── deletePhoto()       → Remove from Storage
```

### Notification Service (`src/services/notifications.ts`)

```
├── requestNotificationPermission()
├── showNotification(title, body)
├── scheduleNotifications(settings)
├── updateBadge(count)
└── getIncompleteDaysCount(settings)
```

### Auth Service (`src/services/auth.ts`)

```
Supabase Auth:
├── signInWithGoogle()
├── signOut()
├── getCurrentUser()
└── onAuthStateChange(callback)
```

### Compression Service (`src/services/compression.ts`)

```
├── compressImage(file)             → Max 500KB, 1920x1920
├── createThumbnail(file)           → 120x120px, 10KB
└── compressAndCreateThumbnail()    → Both in parallel
```

---

## Data Flow Diagrams

### Entry Creation Flow

```
User Input (EntryForm)
       │
       ▼
┌──────────────────┐
│ Photo selected?  │──Yes──► compressAndCreateThumbnail()
└────────┬─────────┘                    │
         │                              │
         ▼                              ▼
┌──────────────────────────────────────────┐
│           store.addEntry(entry)          │
└────────────────────┬─────────────────────┘
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
    db.create    Set pending   Reload
    Entry()      Sync=true     Entries
         │       (if auth)         │
         │           │             │
         │           ▼             │
         │    store.triggerSync()  │
         │           │             │
         │           ▼             │
         │    sync.pushEntry()     │
         │           │             │
         └───────────┴─────────────┘
                     │
                     ▼
              addToast('Saved!')
              updateBadge()
```

### Search Flow

```
SearchBar (query input)
       │
       ▼
┌──────────────────┐
│  Debounce 300ms  │
└────────┬─────────┘
         │
         ▼
store.searchEntries(query)
         │
         ▼
db.searchEntries(query)    ← Full-text search in IndexedDB
         │
         ▼
store.searchResults = [...]
         │
         ▼
History page re-renders with filtered results
```

### Cloud Sync Flow

```
Trigger Events:
├── User signs in
├── App comes online
└── Entry created/updated (when authenticated)
         │
         ▼
┌──────────────────────────────────────────────────────┐
│                  store.triggerSync()                  │
└────────────────────────┬─────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────┐
│                    sync.syncAll()                     │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │ PULL: pullEntries(lastSyncTime)                 │ │
│  │   For each remote entry:                        │ │
│  │   ├── Missing locally? → Create local           │ │
│  │   └── Remote newer? → Update local              │ │
│  └─────────────────────────────────────────────────┘ │
│                         │                             │
│                         ▼                             │
│  ┌─────────────────────────────────────────────────┐ │
│  │ PUSH: entries with pendingSync=true             │ │
│  │   For each local entry:                         │ │
│  │   ├── Has photo? → uploadPhoto()                │ │
│  │   ├── pushEntry() to Supabase                   │ │
│  │   └── Clear pendingSync, set cloudId            │ │
│  └─────────────────────────────────────────────────┘ │
│                                                       │
└──────────────────────────────────────────────────────┘
                         │
                         ▼
              Update lastSyncTime
              Reload entries from IndexedDB
              addToast('Synced: X up, Y down')
```

### Notification & Badge Flow

```
App Init / Entry Change
         │
         ▼
┌───────────────────────────┐
│ getIncompleteDaysCount()  │
│ (checks notif settings)   │
└─────────────┬─────────────┘
              │
              ▼
┌───────────────────────────┐
│ Current time >= first     │──No──► Badge = 0
│ notification time?        │
└─────────────┬─────────────┘
              │Yes
              ▼
┌───────────────────────────┐
│ Today's entry complete?   │──Yes──► Badge = 0
└─────────────┬─────────────┘
              │No
              ▼
         Badge = 1
              │
              ▼
    navigator.setAppBadge(1)
```

---

## Component Hierarchy

```
App
├── Onboarding (first-time users)
│
├── Main Layout
│   ├── Pages
│   │   ├── Home
│   │   │   ├── EmptyCard (missing entries)
│   │   │   └── EntryCard (random memory)
│   │   │
│   │   ├── Calendar
│   │   │   └── Day grid with indicators
│   │   │
│   │   ├── Analytics
│   │   │   ├── Streak cards
│   │   │   ├── Time distribution chart
│   │   │   └── Word cloud
│   │   │
│   │   ├── History
│   │   │   ├── SearchBar
│   │   │   └── EntryCard list
│   │   │
│   │   └── Settings
│   │       ├── Notification toggles
│   │       ├── Sync status
│   │       └── Data management
│   │
│   ├── Navigation (bottom tabs)
│   ├── Toast (notifications)
│   └── UpdatePrompt (PWA updates)
│
├── EntryForm (modal/page)
│   ├── PhotoUpload
│   └── FAB (save button)
│
└── PhotoModal (full-screen image view)
```

---

## Key Components

| Component | File | Purpose |
|-----------|------|---------|
| **Navigation** | `src/components/Navigation.tsx` | Bottom tab bar |
| **EntryForm** | `src/components/EntryForm.tsx` | Create/edit entry with animation |
| **EntryCard** | `src/components/EntryCard.tsx` | Collapsed/expanded entry view |
| **EmptyCard** | `src/components/EntryCard.tsx` | Placeholder for missing days |
| **SearchBar** | `src/components/SearchBar.tsx` | Sticky search with expand/collapse |
| **PhotoUpload** | `src/components/PhotoUpload.tsx` | Camera/gallery picker + compression |
| **PhotoModal** | `src/components/PhotoModal.tsx` | Full-screen photo viewer |
| **Toast** | `src/components/Toast.tsx` | Success/error notifications |
| **Onboarding** | `src/components/Onboarding.tsx` | First-time user flow |

---

## External Integrations

```
┌─────────────────────────────────────────────────────────────────┐
│                        Storyworthy App                          │
└───────┬──────────────┬──────────────┬──────────────┬───────────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌───────────────┐ ┌─────────┐ ┌────────────┐ ┌─────────────────┐
│   IndexedDB   │ │Supabase │ │Notification│ │   PWA/Service   │
│   (Required)  │ │(Optional)│ │    API    │ │     Worker      │
│               │ │         │ │ (Optional) │ │                 │
│ Local storage │ │ • Auth  │ │ • Alerts   │ │ • Offline mode  │
│ for entries   │ │ • DB    │ │ • Badge    │ │ • Install       │
│ and drafts    │ │ • Storage│ │ • Schedule│ │ • Cache         │
└───────────────┘ └─────────┘ └────────────┘ └─────────────────┘
```

| Integration | Required | Fallback |
|-------------|----------|----------|
| IndexedDB | Yes | App won't work |
| Supabase | No | Works offline-only |
| Notifications | No | No reminders |
| PWA | No | Works as web app |

---

## File Structure

```
src/
├── App.tsx                 # Main app component
├── main.tsx                # Entry point
├── index.css               # Global styles & CSS variables
│
├── pages/                  # Page components
│   ├── Home.tsx
│   ├── Calendar.tsx
│   ├── Analytics.tsx
│   ├── History.tsx
│   └── Settings.tsx
│
├── components/             # Reusable components
│   ├── Navigation.tsx
│   ├── EntryForm.tsx
│   ├── EntryCard.tsx
│   ├── SearchBar.tsx
│   ├── PhotoUpload.tsx
│   ├── PhotoModal.tsx
│   ├── Toast.tsx
│   ├── Onboarding.tsx
│   └── UpdatePrompt.tsx
│
├── services/               # Business logic
│   ├── db.ts              # IndexedDB operations
│   ├── auth.ts            # Supabase auth
│   ├── sync.ts            # Cloud sync logic
│   ├── notifications.ts   # Notifications & badge
│   ├── compression.ts     # Image processing
│   └── supabase.ts        # Supabase client
│
├── store/                  # State management
│   └── index.ts           # Zustand store
│
├── types/                  # TypeScript types
│   └── entry.ts           # Data models
│
├── utils/                  # Utilities
│   ├── date.ts            # Date formatting
│   └── export.ts          # Import/export
│
└── styles/                 # Additional styles
    └── transitions.css    # Animation classes
```

---

## Security & Privacy

- **Local-first**: All data stored locally in IndexedDB by default
- **Optional cloud**: Supabase sync is opt-in via Google sign-in
- **RLS protected**: Supabase tables have Row Level Security (users see only their data)
- **No tracking**: No analytics or third-party tracking
- **Data portability**: Full export/import in JSON format

---

## PWA Features

- **Installable**: Add to home screen on mobile/desktop
- **Offline**: Service worker caches app shell
- **Badge**: App icon shows missed entries count
- **Updates**: Prompt when new version available

---

## Performance Optimizations

- **Image compression**: Photos compressed to max 500KB before storage
- **Thumbnails**: 120x120px previews for list views
- **Debounced search**: 300ms delay to reduce DB queries
- **Lazy loading**: Entries loaded on demand
- **Memoization**: useMemo for expensive calculations (analytics)
