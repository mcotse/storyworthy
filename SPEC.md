# Daily Moments - Comprehensive Technical Specification

## Overview

**App Name:** Daily Moments
**Short Name:** Moments
**Platform:** Progressive Web App (PWA) optimized for iPhone 17 Pro Max
**Purpose:** A minimal, distraction-free daily journaling app for capturing storyworthy moments and gratitude

---

## Technical Stack

- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite with vite-plugin-pwa
- **Storage:** IndexedDB (via native API)
- **PWA:** Service Worker with offline-first architecture
- **Image Processing:** browser-image-compression library
- **ML Model:** TensorFlow.js (lightweight sentiment analysis model, ~2MB)
- **Styling:** CSS Modules or Styled Components (calm neutral tones design system)

---

## Design System

### Visual Style
- **Theme:** Calm neutral tones - soft beiges, warm grays, breathing room
- **Typography:** Serif font for entry content, sans-serif for UI elements
- **Color Palette:**
  - Primary: Muted terracotta (#D4A59A)
  - Background: Soft beige (#FAF8F5)
  - Text: Warm dark gray (#3A3A3A)
  - Accent: Deeper terracotta for CTAs (#C4887A)
- **Shadows:** Subtle, soft shadows for depth
- **Spacing:** Generous padding and margins for breathing room

### Theme Support
- **Light mode only** at launch (dark mode deferred to v2)

---

## Data Architecture

### IndexedDB Schema

**Database Name:** `daily-moments-db`
**Version:** 1

**Object Store: `entries`**
```typescript
interface Entry {
  date: string; // ISO date string (YYYY-MM-DD) - PRIMARY KEY
  storyworthy: string;
  thankful: string;
  photo?: string; // Base64 data URL of compressed image
  createdAt: number; // Unix timestamp (when entry was submitted)
  modifiedAt?: number; // Unix timestamp (when entry was last edited)
}
```

**Indexes:**
- `date` (primary key, unique)
- `createdAt` (for time-of-day analytics)

**Storage Strategy:**
- Photos compressed to max 500KB using browser-image-compression
- Target dimensions: max 1920px width/height, maintain aspect ratio
- Quality: 0.8 JPEG compression
- EXIF data preserved (orientation)

### Export Format

**Filename:** `daily-moments-export-YYYY-MM-DD.json`

```typescript
interface ExportData {
  metadata: {
    version: "1.0",
    exportDate: string, // ISO timestamp
    entryCount: number,
    appName: "Daily Moments"
  },
  entries: Entry[] // Array of all entries (photos excluded)
}
```

**Import Behavior:**
- Skip existing entries (preserve local data)
- Only import new dates that don't exist locally
- Show success toast: "Imported X new entries"

---

## Core Features

### 1. Entry Creation Flow

#### Trigger Points
1. **App open (auto-prompt):** If today's entry incomplete, show entry screen immediately
2. **Notification tap:** Navigate directly to entry screen for today
3. **Manual navigation:** Empty card on home page, calendar date tap, nav bar "+" button (optional)

#### Entry Screen UI
- **Layout:** Minimal, distraction-free full-screen view
- **Fields:**
  1. **Storyworthy moment** (textarea)
     - Placeholder: "What's the storyworthy moment of today?"
     - No character limit (with soft warning >1000 chars)
     - Auto-resize textarea
  2. **Thankful for** (textarea)
     - Placeholder: "What are you thankful for today?"
     - No character limit
     - Auto-resize textarea
  3. **Photo attachment** (optional)
     - Button: "Add Photo" with camera icon
     - Tap → Show action sheet: "Take Photo" | "Choose from Library"
     - Preview thumbnail shown after selection with remove (X) button

#### Validation
- **Required:** At least ONE field (storyworthy OR thankful) must have content
- **Error state:** Show subtle red border + message if submit attempted with both empty

#### Auto-Save
- Draft auto-saves to IndexedDB every 2 seconds while typing
- Draft key: `draft-${date}`
- On screen mount, restore draft if exists
- Clear draft after successful submission

#### Submit Behavior
- Button: "Save Entry" (primary button, bottom of screen)
- On submit:
  1. Validate fields
  2. Compress photo if attached
  3. Save to IndexedDB with `createdAt` timestamp
  4. Clear draft
  5. Show success toast: "Entry saved!"
  6. Navigate to home page
  7. Clear notification badge

### 2. Home Page

#### Layout
- **Top:** Header with "Daily Moments" title
- **Main:** Scrollable list of entry cards
- **Bottom:** Navigation bar

#### Entry Cards
- **Sort Order:** Reverse chronological (newest first, today at top)
- **Card States:**
  1. **Completed (collapsed):**
     - Date (e.g., "Today", "Yesterday", "Mon, Jan 6, 2026")
     - First line of storyworthy moment (truncated with "...")
     - Thumbnail of photo if exists (small, 60x60px rounded corner)
     - Subtle card shadow
  2. **Completed (expanded):**
     - Full date
     - Complete storyworthy text
     - Complete thankful text
     - Full photo (tap for full-screen modal)
     - Edit icon (top right) → Navigate to edit screen
     - Last modified timestamp if edited: "Edited 2 days ago" (subtle gray text)
  3. **Incomplete (empty):**
     - Date with notification badge (red dot with count)
     - Text: "Tap to create today's entry"
     - Dashed border styling

#### Card Interaction
- **Tap card:** Smooth slide-down expansion (300ms ease-out)
- **Tap again:** Collapse back to preview
- **Tap edit icon:** Navigate to edit screen with pre-filled data
- **Tap photo:** Open full-screen modal with pinch-to-zoom

#### Empty State (First-Time User)
- Friendly illustration (person writing/reflecting)
- Text: "Start your first entry to begin your journey"
- Primary CTA: "Create Entry"

#### Performance
- **Virtual scrolling** using React Window or similar
- Only render visible cards + buffer (10 above/below viewport)
- Load entries in chunks of 50 from IndexedDB

#### Search Feature
- Search icon in header (magnifying glass)
- Tap → Expand search bar
- Full-text search across both storyworthy and thankful fields
- IndexedDB query with cursor filtering
- Real-time filter as user types (debounced 300ms)
- Show result count: "12 entries found"

### 3. Calendar View

#### Layout
- Monthly calendar grid (7 columns x 5-6 rows)
- Month/Year header at top
- Navigation: Left/right arrows for month change
- Swipe gestures: Swipe left (next month), swipe right (prev month)

#### Date States
1. **Has entry:** Date number with small dot indicator below
2. **No entry (past):** Grayed date number, no indicator
3. **Today:** Highlighted with accent color circle background
4. **Future dates:** Light gray, not clickable, no interaction
5. **Current month:** Full opacity dates
6. **Other month dates:** 40% opacity (shown for context)

#### Interaction
- **Tap date with entry:** Navigate to detail view (same as expanded home card)
- **Tap empty past date:** Navigate to entry creation screen with that date pre-filled
- **Tap future date:** No action (visually disabled)

#### Month Navigation
- Arrows: Animated slide transition (200ms) between months
- Swipe: Natural gesture-based navigation with momentum

#### Empty State
- Illustration: Calendar with sparkles
- Text: "No entries yet. Start journaling today!"
- CTA: "Create First Entry"

### 4. Analytics View

#### Layout
Four sections in vertical scroll:

##### 4.1 Streak Tracking
- **Current Streak:** Large number with fire emoji or icon
- **Longest Streak:** Secondary metric
- **Completion Rate:** Percentage with progress ring
- **Grace Period:** 1-day grace doesn't break streak
  - UI: Show "Streak saved!" animation if grace used
  - Tooltip: "1-day grace period active"
- **Compassionate messaging:** "Start a new streak today!" if broken

##### 4.2 Word Cloud
- Visual word cloud of most-used words (top 50)
- Font size proportional to frequency
- Uses entries from all fields
- **Interaction:** Tap word → Filter home page to entries containing that word
  - Navigate to home view with filter applied
  - Show "Showing entries with 'grateful'" header
  - Clear filter button visible

##### 4.3 Time-of-Day Patterns
- Bar chart with 4 periods:
  - Morning (5 AM - 11 AM)
  - Afternoon (11 AM - 5 PM)
  - Evening (5 PM - 9 PM)
  - Night (9 PM - 5 AM)
- Show count and percentage of entries per period
- Insight text: "You journal most in the Evening"

##### 4.4 Sentiment Analysis
- Line chart over time (weekly buckets for >30 entries, daily for less)
- Uses TensorFlow.js lightweight model for sentiment scoring
- Y-axis: Sentiment score (-1.0 to +1.0)
- Color gradient: Red (negative) → Yellow (neutral) → Green (positive)
- Insight text: "Your gratitude entries show 15% more positive sentiment"
- **Performance:** Run sentiment analysis on entries in batches (Web Worker)
- Cache results, only analyze new/modified entries

#### Empty State
- Illustration: Charts and graphs
- Text: "Create at least 7 entries to see insights"
- Progress indicator: "3/7 entries completed"

### 5. Random View

#### Layout
- Full entry detail view (same as expanded home card)
- Prominent "Refresh" button at bottom
- Entry date shown at top
- Entry content (storyworthy + thankful + photo)

#### Randomization Logic
- **Smart random:** Track last 10 shown entries
- Don't repeat any of the last 10 until all others have been shown
- Cycle through entire history before repeating
- Store in localStorage: `random-history: string[]` (array of dates)

#### Interaction
- **Refresh button:** Smooth fade transition (200ms) to next random entry
- **Swipe up:** Also triggers refresh (alternative gesture)
- Can still edit from this view (edit icon present)

#### Empty State
- Illustration: Dice or shuffle icon
- Text: "Create your first entry to see random memories"
- CTA: "Create Entry"

---

## Bottom Navigation Bar

### Tabs (Left to Right)
1. **Home:** House icon
2. **Calendar:** Calendar icon
3. **Analytics:** Bar chart icon
4. **Random:** Shuffle icon
5. **Settings:** Gear icon (optional, or hamburger menu)

### Active Tab Indicator
- Thin underline accent bar (2px, primary color)
- Icon stays same (no fill change)
- Label subtle color change (optional)

### Navigation Behavior
- Instant tab switching (no loading delay)
- Preserve scroll position when returning to tabs
- Smooth fade transition (150ms) between tab content

---

## Notifications

### Strategy
- **Type:** Local scheduled notifications (Web Notifications API)
- **No backend** required

### Scheduling
- **Morning reminder:** 9:00 AM daily
- **Evening reminder:** 9:00 PM daily
- **Logic:**
  - Check if today's entry exists
  - If incomplete, fire notification
  - If complete, skip notification

### Notification Content
- **Title:** "Daily Moments"
- **Body:** "Take a moment to reflect on today" (morning) | "How was your day?" (evening)
- **Icon:** App icon
- **Badge:** App badge shows count of incomplete days (capped at 9+)

### Notification Interaction
- **Tap notification:** Open app to entry screen for today
- **App already open:** Show in-app toast banner at top
  - Message: "Time to reflect on today"
  - Action: "Start Entry" button
  - Dismissible with X button

### Permission Request
- **Timing:** After user completes their first entry
- **Modal:**
  - Title: "Never miss a moment"
  - Body: "Get gentle reminders at 9 AM and 9 PM to capture your day"
  - Buttons: "Enable Notifications" | "Not Now"
- **If denied:** Respect decision, no further prompts
  - App works fine without notifications
  - User must enable manually in iOS settings

### Badge Management
- **Update badge count** on:
  1. Entry creation/completion
  2. App launch
  3. Notification dismissed
- **Badge count:** Number of incomplete past days (including today)
- **Max display:** 9+ (even if more incomplete days exist)

---

## PWA Configuration

### Manifest (`manifest.json`)
```json
{
  "name": "Daily Moments",
  "short_name": "Moments",
  "description": "Capture your storyworthy moments and gratitude daily",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#D4A59A",
  "background_color": "#FAF8F5",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

### Service Worker
- **Strategy:** Offline-first with Network First for API calls (none initially)
- **Cache:**
  - App shell (HTML, CSS, JS)
  - Static assets (fonts, icons)
  - TensorFlow.js model
- **Background Sync:** Not needed (local-only app)
- **Update Strategy:**
  - On update available, show toast: "New version available"
  - Action: "Refresh" button to reload with new version

### Install Prompt
- **Timing:** Show after 3rd visit OR after 2nd entry (whichever comes first)
- **Also available:** Manual install option in Settings
- **Prompt UI:**
  - Modal or bottom sheet
  - Title: "Add to Home Screen"
  - Body: "Install Daily Moments for the best experience"
  - Buttons: "Install" | "Maybe Later"
- **Suppress if dismissed:** Don't show again for 7 days

---

## Settings Panel

### Location
- **Access:** Gear icon in bottom nav OR hamburger menu in header

### Settings Sections

#### 1. Notifications
- **Morning Reminder**
  - Toggle: Enable/Disable
  - Time picker: Default 9:00 AM
- **Evening Reminder**
  - Toggle: Enable/Disable
  - Time picker: Default 9:00 PM
- **Permission Status:** Show if notifications enabled in system
  - If disabled: "Enable in iOS Settings" link

#### 2. Data Management
- **Export Data**
  - Button: "Export All Entries"
  - Action: Generate JSON file and trigger download
  - Filename: `daily-moments-export-YYYY-MM-DD.json`
  - Note: "Photos are not included in export"
- **Import Data**
  - Button: "Import from File"
  - Action: File picker → JSON validation → Import
  - Show import summary: "Imported 23 new entries"
- **Storage Usage**
  - Display: "Using 12.5 MB of 50 MB available"
  - Visual: Progress bar
- **Clear All Data**
  - Button: "Delete All Entries" (red, destructive)
  - Confirmation modal: "Are you sure? This cannot be undone."
  - Require typing "DELETE" to confirm
  - Action: Clear IndexedDB, reset app state

#### 3. About
- **Version:** Display app version
- **Install App:** Manual button to trigger install prompt (if not already installed)

---

## Editing Functionality

### Edit Screen
- **Layout:** Same as entry creation screen
- **Pre-filled:** Existing entry data loaded from IndexedDB
- **Title:** "Edit Entry - [Date]"
- **Delete Option:**
  - Trash icon in header (top right)
  - Tap → Confirmation modal: "Delete this entry?"
  - Buttons: "Cancel" | "Delete"
  - On delete: Remove from IndexedDB, navigate to home, show toast "Entry deleted"

### Edit Behavior
- **Save:** Updates existing entry
- **Modified timestamp:** Update `modifiedAt` field
- **Auto-save:** Draft saved every 2 seconds (same as create)
- **Validation:** Same as creation (at least one field required)

---

## Onboarding Flow

### First Launch Experience
**3-Step Tutorial (Swipeable Cards):**

#### Step 1: Welcome
- Illustration: Person writing peacefully
- Title: "Welcome to Daily Moments"
- Body: "Capture your storyworthy moments and gratitude daily"
- CTA: "Next"

#### Step 2: Notifications
- Illustration: Phone with notification
- Title: "Never Miss a Moment"
- Body: "Gentle reminders at 9 AM and 9 PM help you build the habit"
- CTA: "Next"

#### Step 3: Get Started
- Illustration: Calendar with checkmarks
- Title: "Start Your Journey"
- Body: "Your entries are private and stored locally on your device"
- CTA: "Create First Entry"

**Skip Option:** "Skip" button on each step (top right)

**Storage:** Track onboarding completion in localStorage: `onboarding-complete: true`

---

## Error Handling

### Strategy
- **Toast notifications** for all errors
- **Auto-retry** (3 attempts with exponential backoff: 1s, 3s, 9s)
- **User-friendly messages** (no technical jargon)

### Error Scenarios

#### 1. Save Failure (IndexedDB Error)
- **Message:** "Couldn't save entry. Retrying..."
- **Action:** Auto-retry 3 times
- **If all fail:** "Unable to save. Please try again later."
- **Fallback:** Keep draft in memory, save when possible

#### 2. Photo Compression Failure
- **Message:** "Couldn't process photo. Try a different image."
- **Action:** Remove photo from draft, allow retry

#### 3. Import Validation Error
- **Message:** "Import file is invalid. Please check the file format."
- **Details:** Show specific error (e.g., "Missing metadata field")

#### 4. Storage Quota Exceeded
- **Message:** "Storage full. Delete old entries or photos."
- **Action:** Navigate to Data Management settings
- **Info:** Show current storage usage

#### 5. Notification Permission Denied
- **No error shown** (respect user decision)
- **App continues to work** fully without notifications

---

## Performance Optimizations

### Bundle Size
- **Target:** <500KB initial bundle (gzipped)
- **Code splitting:** Split by route (Home, Calendar, Analytics, Random)
- **Lazy loading:** Load TensorFlow.js model only when Analytics tab first opened
- **Tree shaking:** Ensure unused code eliminated

### Image Optimization
- **Compression:** Aggressive (500KB max per photo)
- **Format:** JPEG (smaller than PNG for photos)
- **Loading:** Lazy load images in home page cards (Intersection Observer)
- **Thumbnails:** Generate 60x60px thumbnails for collapsed cards, store separately

### IndexedDB Performance
- **Batch reads:** Load entries in chunks
- **Indexes:** Use indexed queries for date-based lookups
- **Cursor iteration:** For large datasets, use cursors instead of getAll()

### Virtual Scrolling
- **Library:** React Window or TanStack Virtual
- **Buffer:** Render 10 items above/below viewport
- **Item height:** Dynamic height measurement with resize observer

### Loading States
- **Skeleton screens** for initial load
  - Home: Show 5 skeleton cards
  - Calendar: Show month grid skeleton
  - Analytics: Show chart placeholders
- **Transitions:** 150ms fade-in when content loads

---

## Accessibility

### Minimum Support (Light Mode Launch)
- **Semantic HTML:** Proper heading hierarchy, nav elements
- **ARIA labels:** For icon buttons, nav items
- **Focus management:** Visible focus indicators, proper tab order
- **Alt text:** For decorative images and illustrations
- **Color contrast:** Ensure WCAG AA compliance (4.5:1 for text)

### Future Enhancements (v2)
- Full screen reader support
- Keyboard navigation
- High contrast mode
- Reduced motion support

---

## Technical Implementation Notes

### React Component Structure
```
src/
├── components/
│   ├── EntryCard.tsx
│   ├── EntryForm.tsx
│   ├── SearchBar.tsx
│   ├── Navigation.tsx
│   ├── PhotoUpload.tsx
│   └── ...
├── pages/
│   ├── Home.tsx
│   ├── Calendar.tsx
│   ├── Analytics.tsx
│   ├── Random.tsx
│   └── Settings.tsx
├── services/
│   ├── db.ts (IndexedDB operations)
│   ├── notifications.ts
│   ├── sentiment.ts (TensorFlow.js)
│   └── compression.ts
├── hooks/
│   ├── useEntries.ts
│   ├── useNotifications.ts
│   └── ...
├── types/
│   └── entry.ts
└── utils/
    ├── date.ts
    └── export.ts
```

### State Management
- **Zustand** or **React Context** for global state
- **State structure:**
  - `entries: Entry[]`
  - `currentDraft: Partial<Entry> | null`
  - `filter: string | null` (for search)
  - `randomHistory: string[]`
  - `settings: NotificationSettings`

### IndexedDB Operations
```typescript
// Core operations
- createEntry(entry: Entry): Promise<void>
- updateEntry(date: string, entry: Partial<Entry>): Promise<void>
- deleteEntry(date: string): Promise<void>
- getEntry(date: string): Promise<Entry | null>
- getAllEntries(): Promise<Entry[]>
- getEntriesInRange(startDate: string, endDate: string): Promise<Entry[]>
- searchEntries(query: string): Promise<Entry[]>
```

### Photo Compression Flow
```typescript
1. User selects/captures photo
2. Get File object
3. browser-image-compression:
   - maxSizeMB: 0.5
   - maxWidthOrHeight: 1920
   - useWebWorker: true
4. Convert to base64 data URL
5. Store in entry.photo field
```

### Notification Scheduling
```typescript
// Schedule daily notifications
- Use Notification API + setTimeout for scheduling
- On app launch, reschedule notifications for next 2 days
- Check entry completion before firing
- Store scheduled notification IDs in localStorage
```

---

## Edge Cases & Considerations

### Time Zones
- **Strategy:** Store dates as local date strings (YYYY-MM-DD), not UTC
- **Timestamps:** Store createdAt/modifiedAt as UTC Unix timestamps
- **Reason:** Entries are tied to "today" in user's local time, not absolute time

### Offline Functionality
- **Fully offline-first:** All operations work without internet
- **Service Worker:** Caches all app assets
- **IndexedDB:** All data stored locally
- **Photos:** Captured and stored locally

### Multiple Devices
- **No sync initially:** Each device has separate data
- **Export/Import:** Manual data transfer via JSON files
- **Future consideration:** Cloud sync with authentication (v2)

### Data Limits
- **IndexedDB:** ~50MB quota (varies by browser/device)
- **Photos:** ~100 entries with photos before hitting limit (with 500KB compression)
- **Monitoring:** Show storage usage in Settings
- **Mitigation:** User can delete old entries or export/clear data

### Browser Compatibility
- **Target:** Modern mobile browsers (Safari iOS 14+, Chrome Android)
- **IndexedDB:** Well-supported
- **Notifications:** iOS Safari has limitations (local only, no background)
- **Service Workers:** Supported in all target browsers

---

## Future Enhancements (Not in v1)

### v2 Potential Features
- Dark mode support
- Cloud backup with optional account
- Multiple photos per entry
- Voice-to-text for entries
- Tags/categories for entries
- Share entries as images
- Widgets for iOS home screen
- Apple Watch complication
- Export as PDF/printable journal

---

## Success Metrics

### Technical
- **Load time:** <2s on 3G
- **Time to interactive:** <3s
- **Lighthouse PWA score:** 90+
- **Bundle size:** <500KB (gzipped)

### User Experience
- **Notification → entry completion:** <30 seconds
- **Daily active usage:** Goal 70%+
- **Streak retention:** Users maintain 7+ day streaks
- **Installation rate:** 40%+ of returning users install PWA

---

## Development Phases

### Phase 1: Core MVP (Week 1-2)
- Basic entry creation (text only)
- Home page with cards (no search yet)
- IndexedDB storage
- Settings (basic)

### Phase 2: Enhanced UX (Week 3)
- Photo attachment + compression
- Calendar view
- Notifications (local)
- Export/Import

### Phase 3: Analytics & Polish (Week 4)
- Random view
- Analytics (streak + time patterns)
- Search functionality
- Virtual scrolling

### Phase 4: Advanced Analytics (Week 5)
- Word cloud
- Sentiment analysis (TensorFlow.js)
- Onboarding flow
- PWA optimizations

### Phase 5: Testing & Launch (Week 6)
- Bug fixes
- Performance optimization
- Accessibility audit
- Launch preparation

---

## Conclusion

This specification captures the complete vision for Daily Moments v1.0 - a focused, offline-first PWA for daily gratitude and journaling. The app prioritizes simplicity, privacy, and habit-building through thoughtful UX and reliable notifications. All data remains local to the user's device, with manual export options for portability.
