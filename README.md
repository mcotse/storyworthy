# Daily Moments

A minimal, distraction-free PWA for capturing storyworthy moments and gratitude daily.

**Live App:** https://mcotse.github.io/storyworthy/

## Features

- **Daily Journaling** - Capture storyworthy moments and gratitude entries
- **Photo Attachments** - Add photos with automatic compression
- **Auto-Save** - Drafts saved every 2 seconds
- **Calendar View** - Browse entries by date
- **Analytics** - Track streaks, writing patterns, and word frequency
- **Random Memory** - Rediscover past entries
- **Offline Support** - Works without internet as a PWA
- **Privacy First** - All data stored locally on your device

## Tech Stack

- React 19 + TypeScript
- Vite + vite-plugin-pwa
- IndexedDB for local storage
- Zustand for state management
- date-fns for date handling

## Install on Your Phone

1. Open https://mcotse.github.io/storyworthy/ in Safari (iOS) or Chrome (Android)
2. Tap **Share** → **Add to Home Screen**
3. The app works offline like a native app

## Development

```bash
# Install dependencies
bun install

# Start dev server
bun run dev

# Build for production
bun run build

# Preview production build
bun run preview

# Run tests
bun run test:run
```

## License

MIT
