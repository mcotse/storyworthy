import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Entry, NotificationSettings } from '../types/entry';
import * as db from '../services/db';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
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
  activeTab: 'home' | 'calendar' | 'analytics' | 'random' | 'settings';
  expandedCardDate: string | null;

  // Toasts
  toasts: Toast[];

  // Settings
  notificationSettings: NotificationSettings;
  onboardingComplete: boolean;
  installPromptDismissedAt: number | null;

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
  setOnboardingComplete: (complete: boolean) => void;
  setInstallPromptDismissed: () => void;
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
        morningEnabled: true,
        morningTime: '09:00',
        eveningEnabled: true,
        eveningTime: '21:00',
      },
      onboardingComplete: false,
      installPromptDismissedAt: null,

      // Actions
      loadEntries: async () => {
        set({ isLoading: true, error: null });
        try {
          const entries = await db.getAllEntries();
          set({ entries, isLoading: false });
        } catch (error) {
          set({ error: 'Failed to load entries', isLoading: false });
        }
      },

      addEntry: async (entry: Entry) => {
        try {
          await db.createEntry(entry);
          const entries = await db.getAllEntries();
          set({ entries });
          get().addToast('Entry saved!', 'success');
        } catch (error) {
          get().addToast('Failed to save entry', 'error');
          throw error;
        }
      },

      updateEntry: async (date: string, updates: Partial<Entry>) => {
        try {
          await db.updateEntry(date, updates);
          const entries = await db.getAllEntries();
          set({ entries });
          get().addToast('Entry updated!', 'success');
        } catch (error) {
          get().addToast('Failed to update entry', 'error');
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

      setOnboardingComplete: (complete) => {
        set({ onboardingComplete: complete });
      },

      setInstallPromptDismissed: () => {
        set({ installPromptDismissedAt: Date.now() });
      },
    }),
    {
      name: 'daily-moments-storage',
      partialize: (state) => ({
        notificationSettings: state.notificationSettings,
        onboardingComplete: state.onboardingComplete,
        randomHistory: state.randomHistory,
        installPromptDismissedAt: state.installPromptDismissedAt,
      }),
    }
  )
);
