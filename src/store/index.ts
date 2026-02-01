import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@supabase/supabase-js';
import type { Entry, NotificationSettings, Reminder, LegacyNotificationSettings } from '../types/entry';
import * as db from '../services/db';
import * as sync from '../services/sync';
import * as auth from '../services/auth';
import { isSupabaseConfigured } from '../services/supabase';
import { logger } from '../services/logger';

const log = logger.child({ service: 'store' });

export type Tab = 'home' | 'calendar' | 'history' | 'trends' | 'settings';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface SyncProgress {
  phase: 'pulling' | 'pushing';
  current: number;
  total: number;
}

interface AppState {
  // Entries
  entries: Entry[];
  isLoading: boolean;
  error: string | null;

  // Search
  searchQuery: string;
  searchResults: Entry[];

  // Random view
  randomHistory: string[];

  // UI State
  activeTab: Tab;
  expandedCardDate: string | null;

  // Toasts
  toasts: Toast[];

  // Settings
  notificationSettings: NotificationSettings;
  onboardingComplete: boolean;
  installPromptDismissedAt: number | null;
  missedDaysLimit: number;
  savePhotosToDevice: boolean;
  savePhotosPromptShown: boolean;

  // Auth & Sync
  user: User | null;
  authLoading: boolean;
  isSyncing: boolean;
  syncProgress: SyncProgress | null;
  lastSyncTime: number | null;
  isOnline: boolean;

  // Actions
  loadEntries: () => Promise<void>;
  addEntry: (entry: Entry) => Promise<void>;
  updateEntry: (date: string, updates: Partial<Entry>) => Promise<void>;
  deleteEntry: (date: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  searchEntries: (query: string) => Promise<void>;
  clearSearch: () => void;
  setActiveTab: (tab: AppState['activeTab']) => void;
  setExpandedCard: (date: string | null) => void;
  getRandomEntry: () => Entry | null;
  addToast: (message: string, type: Toast['type']) => void;
  removeToast: (id: string) => void;
  setNotificationSettings: (settings: NotificationSettings) => void;
  addReminder: (reminder: Reminder) => void;
  updateReminder: (id: string, updates: Partial<Reminder>) => void;
  removeReminder: (id: string) => void;
  setOnboardingComplete: (complete: boolean) => void;
  setInstallPromptDismissed: () => void;
  setMissedDaysLimit: (days: number) => void;
  setSavePhotosToDevice: (enabled: boolean) => void;
  setSavePhotosPromptShown: (shown: boolean) => void;

  // Auth actions
  initAuth: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;

  // Sync actions
  triggerSync: () => Promise<void>;
  setOnline: (online: boolean) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Initial state
      entries: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      searchResults: [],
      randomHistory: [],
      activeTab: 'home',
      expandedCardDate: null,
      toasts: [],
      notificationSettings: {
        reminders: [
          { id: 'morning', time: '09:00', enabled: true, label: 'Morning' },
          { id: 'evening', time: '21:00', enabled: true, label: 'Evening' },
        ],
      },
      onboardingComplete: false,
      installPromptDismissedAt: null,
      missedDaysLimit: 7,
      savePhotosToDevice: false,
      savePhotosPromptShown: false,

      // Auth & Sync initial state
      user: null,
      authLoading: true,
      isSyncing: false,
      syncProgress: null,
      lastSyncTime: sync.getLastSyncTime(),
      isOnline: navigator.onLine,

      // Actions
      loadEntries: async () => {
        set({ isLoading: true, error: null });
        try {
          const entries = await db.getAllEntries();
          log.info('entries_loaded', { count: entries.length });
          set({ entries, isLoading: false });
        } catch (error) {
          log.error('entries_load_failed', error);
          set({ error: 'Failed to load entries', isLoading: false });
        }
      },

      addEntry: async (entry: Entry) => {
        try {
          // Mark as pending sync if user is authenticated
          const { user } = get();
          const entryWithSync = user
            ? { ...entry, pendingSync: true }
            : entry;

          await db.createEntry(entryWithSync);
          const entries = await db.getAllEntries();
          set({ entries });
          get().addToast('Entry saved!', 'success');

          // Trigger sync if online and authenticated (fire-and-forget with error handling)
          if (user) {
            get().triggerSync().catch((err) => {
              log.error('background_sync_failed', err, { trigger: 'add_entry' });
            });
          }
        } catch (error) {
          // Pass through the detailed error message
          const message = error instanceof Error ? error.message : 'Failed to save entry';
          get().addToast(message, 'error');
          throw error;
        }
      },

      updateEntry: async (date: string, updates: Partial<Entry>) => {
        try {
          // Mark as pending sync if user is authenticated
          const { user } = get();
          const updatesWithSync = user
            ? { ...updates, pendingSync: true }
            : updates;

          await db.updateEntry(date, updatesWithSync);
          const entries = await db.getAllEntries();
          set({ entries });
          get().addToast('Entry updated!', 'success');

          // Trigger sync if online and authenticated (fire-and-forget with error handling)
          if (user) {
            get().triggerSync().catch((err) => {
              log.error('background_sync_failed', err, { trigger: 'update_entry' });
            });
          }
        } catch (error) {
          // Pass through the detailed error message
          const message = error instanceof Error ? error.message : 'Failed to update entry';
          get().addToast(message, 'error');
          throw error;
        }
      },

      deleteEntry: async (date: string) => {
        try {
          await db.deleteEntry(date);
          const entries = await db.getAllEntries();
          set({ entries, expandedCardDate: null });
          get().addToast('Entry deleted', 'success');
        } catch (error) {
          get().addToast('Failed to delete entry', 'error');
          throw error;
        }
      },

      setSearchQuery: (query: string) => {
        set({ searchQuery: query });
      },

      searchEntries: async (query: string) => {
        if (!query.trim()) {
          set({ searchResults: [], searchQuery: '' });
          return;
        }
        const results = await db.searchEntries(query);
        set({ searchResults: results, searchQuery: query });
      },

      clearSearch: () => {
        set({ searchQuery: '', searchResults: [] });
      },

      setActiveTab: (tab) => {
        set({ activeTab: tab });
      },

      setExpandedCard: (date) => {
        set({ expandedCardDate: date });
      },

      getRandomEntry: () => {
        const { entries, randomHistory } = get();
        if (entries.length === 0) return null;

        // Get entries not in recent history
        const availableEntries = entries.filter(
          (e) => !randomHistory.slice(-10).includes(e.date)
        );

        // If all entries are in history, reset
        const pool = availableEntries.length > 0 ? availableEntries : entries;

        // Pick random entry
        const randomIndex = Math.floor(Math.random() * pool.length);
        const randomEntry = pool[randomIndex];

        // Update history (keep last 10)
        const newHistory = [...randomHistory, randomEntry.date].slice(-10);
        set({ randomHistory: newHistory });

        return randomEntry;
      },

      addToast: (message, type) => {
        const id = Date.now().toString();
        set((state) => ({
          toasts: [...state.toasts, { id, message, type }],
        }));

        // Auto-remove after 3 seconds
        setTimeout(() => {
          get().removeToast(id);
        }, 3000);
      },

      removeToast: (id) => {
        set((state) => ({
          toasts: state.toasts.filter((t) => t.id !== id),
        }));
      },

      setNotificationSettings: (settings) => {
        set({ notificationSettings: settings });
      },

      addReminder: (reminder) => {
        const { notificationSettings } = get();
        if (notificationSettings.reminders.length >= 5) {
          get().addToast('Maximum of 5 reminders allowed', 'error');
          return;
        }
        set({
          notificationSettings: {
            ...notificationSettings,
            reminders: [...notificationSettings.reminders, reminder],
          },
        });
      },

      updateReminder: (id, updates) => {
        const { notificationSettings } = get();
        set({
          notificationSettings: {
            ...notificationSettings,
            reminders: notificationSettings.reminders.map((r) =>
              r.id === id ? { ...r, ...updates } : r
            ),
          },
        });
      },

      removeReminder: (id) => {
        const { notificationSettings } = get();
        set({
          notificationSettings: {
            ...notificationSettings,
            reminders: notificationSettings.reminders.filter((r) => r.id !== id),
          },
        });
      },

      setOnboardingComplete: (complete) => {
        set({ onboardingComplete: complete });
      },

      setInstallPromptDismissed: () => {
        set({ installPromptDismissedAt: Date.now() });
      },

      setMissedDaysLimit: (days: number) => {
        set({ missedDaysLimit: days });
      },

      setSavePhotosToDevice: (enabled: boolean) => {
        set({ savePhotosToDevice: enabled });
      },

      setSavePhotosPromptShown: (shown: boolean) => {
        set({ savePhotosPromptShown: shown });
      },

      // Auth actions
      initAuth: async () => {
        if (!isSupabaseConfigured()) {
          log.debug('auth_init_skipped', { reason: 'supabase_not_configured' });
          set({ authLoading: false });
          return;
        }

        log.info('auth_init_started');
        set({ authLoading: true });

        // Get current user
        const user = await auth.getCurrentUser();
        log.info('auth_init_completed', { has_user: Boolean(user) });
        set({ user, authLoading: false });

        // Listen for auth changes
        auth.onAuthStateChange((user) => {
          set({ user });
          // Trigger sync when user signs in (fire-and-forget with error handling)
          if (user) {
            get().triggerSync().catch((err) => {
              log.error('background_sync_failed', err, { trigger: 'auth_change' });
            });
          }
        });
      },

      signInWithGoogle: async () => {
        const { error } = await auth.signInWithGoogle();
        if (error) {
          get().addToast('Sign in failed: ' + error.message, 'error');
        }
      },

      signOut: async () => {
        const { error } = await auth.signOut();
        if (error) {
          get().addToast('Sign out failed', 'error');
        } else {
          set({ user: null });
          sync.clearSyncData();
          get().addToast('Signed out', 'success');
        }
      },

      // Sync actions
      triggerSync: async () => {
        const { user, isSyncing, isOnline } = get();

        if (!user || isSyncing || !isOnline || !isSupabaseConfigured()) {
          return;
        }

        set({ isSyncing: true, syncProgress: null });

        try {
          const result = await sync.syncAll((progress) => {
            set({ syncProgress: progress });
          });
          set({ lastSyncTime: Date.now(), syncProgress: null });

          // Reload entries after sync
          const entries = await db.getAllEntries();
          set({ entries });

          if (result.pushed > 0 || result.pulled > 0) {
            get().addToast(
              `Synced: ${result.pushed} up, ${result.pulled} down`,
              'success'
            );
          }

          if (result.errors > 0) {
            get().addToast(`${result.errors} entries failed to sync`, 'error');
          }
        } catch (error) {
          get().addToast('Sync failed', 'error');
        } finally {
          set({ isSyncing: false, syncProgress: null });
        }
      },

      setOnline: (online: boolean) => {
        const wasOffline = !get().isOnline;
        set({ isOnline: online });

        if (online && wasOffline) {
          log.info('network_status_changed', { status: 'online' });
          // Auto-sync when coming back online (fire-and-forget with error handling)
          if (get().user) {
            get().triggerSync().catch((err) => {
              log.error('background_sync_failed', err, { trigger: 'online' });
            });
          }
        } else if (!online) {
          log.info('network_status_changed', { status: 'offline' });
        }
      },
    }),
    {
      name: 'daily-moments-storage',
      version: 1,
      partialize: (state) => ({
        notificationSettings: state.notificationSettings,
        onboardingComplete: state.onboardingComplete,
        randomHistory: state.randomHistory,
        installPromptDismissedAt: state.installPromptDismissedAt,
        missedDaysLimit: state.missedDaysLimit,
        savePhotosToDevice: state.savePhotosToDevice,
        savePhotosPromptShown: state.savePhotosPromptShown,
      }),
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>;

        // Migration from version 0 (no version) to version 1: convert legacy notification settings
        if (version === 0) {
          const legacySettings = state.notificationSettings as LegacyNotificationSettings | undefined;
          if (legacySettings && 'morningEnabled' in legacySettings) {
            const reminders: Reminder[] = [];
            if (legacySettings.morningEnabled || legacySettings.morningTime) {
              reminders.push({
                id: 'morning',
                time: legacySettings.morningTime || '09:00',
                enabled: legacySettings.morningEnabled ?? true,
                label: 'Morning',
              });
            }
            if (legacySettings.eveningEnabled || legacySettings.eveningTime) {
              reminders.push({
                id: 'evening',
                time: legacySettings.eveningTime || '21:00',
                enabled: legacySettings.eveningEnabled ?? true,
                label: 'Evening',
              });
            }
            state.notificationSettings = { reminders };
          }
        }

        return state;
      },
    }
  )
);
