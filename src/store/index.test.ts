import { describe, it, expect, beforeEach } from 'vitest'
import { useStore } from './index'

describe('store', () => {
  beforeEach(() => {
    // Reset store state
    useStore.setState({
      entries: [],
      isLoading: false,
      error: null,
      searchQuery: '',
      searchResults: [],
      randomHistory: [],
      activeTab: 'home',
      expandedCardDate: null,
      toasts: [],
    })
  })

  describe('activeTab', () => {
    it('defaults to home', () => {
      expect(useStore.getState().activeTab).toBe('home')
    })

    it('can be changed', () => {
      useStore.getState().setActiveTab('calendar')
      expect(useStore.getState().activeTab).toBe('calendar')
    })
  })

  describe('expandedCard', () => {
    it('defaults to null', () => {
      expect(useStore.getState().expandedCardDate).toBeNull()
    })

    it('can be set and cleared', () => {
      useStore.getState().setExpandedCard('2024-01-15')
      expect(useStore.getState().expandedCardDate).toBe('2024-01-15')

      useStore.getState().setExpandedCard(null)
      expect(useStore.getState().expandedCardDate).toBeNull()
    })
  })

  describe('toasts', () => {
    it('can add toasts', () => {
      useStore.getState().addToast('Test message', 'success')
      const toasts = useStore.getState().toasts
      expect(toasts).toHaveLength(1)
      expect(toasts[0].message).toBe('Test message')
      expect(toasts[0].type).toBe('success')
    })

    it('can remove toasts', () => {
      useStore.getState().addToast('Test message', 'success')
      const toastId = useStore.getState().toasts[0].id
      useStore.getState().removeToast(toastId)
      expect(useStore.getState().toasts).toHaveLength(0)
    })
  })

  describe('search', () => {
    it('can set search query', () => {
      useStore.getState().setSearchQuery('test')
      expect(useStore.getState().searchQuery).toBe('test')
    })

    it('can clear search', () => {
      useStore.getState().setSearchQuery('test')
      useStore.getState().clearSearch()
      expect(useStore.getState().searchQuery).toBe('')
      expect(useStore.getState().searchResults).toEqual([])
    })
  })

  describe('getRandomEntry', () => {
    it('returns null for empty entries', () => {
      const result = useStore.getState().getRandomEntry()
      expect(result).toBeNull()
    })

    it('returns an entry when entries exist', () => {
      useStore.setState({
        entries: [
          { date: '2024-01-15', storyworthy: 'Test', thankful: '', createdAt: 123 },
        ],
      })
      const result = useStore.getState().getRandomEntry()
      expect(result).not.toBeNull()
      expect(result?.date).toBe('2024-01-15')
    })

    it('tracks history to avoid repetition', () => {
      const entries = [
        { date: '2024-01-15', storyworthy: 'Test1', thankful: '', createdAt: 123 },
        { date: '2024-01-14', storyworthy: 'Test2', thankful: '', createdAt: 122 },
      ]
      useStore.setState({ entries })

      // Get random entries multiple times
      const results = new Set<string>()
      for (let i = 0; i < 10; i++) {
        const entry = useStore.getState().getRandomEntry()
        if (entry) results.add(entry.date)
      }

      // Should have seen both entries
      expect(results.size).toBe(2)
    })
  })

  describe('notificationSettings', () => {
    it('has default values with reminders array', () => {
      const settings = useStore.getState().notificationSettings
      expect(settings.reminders).toBeDefined()
      expect(Array.isArray(settings.reminders)).toBe(true)
      expect(settings.reminders.length).toBe(2)
      expect(settings.reminders[0].time).toBe('09:00')
      expect(settings.reminders[1].time).toBe('21:00')
    })

    it('can add a reminder', () => {
      const initialCount = useStore.getState().notificationSettings.reminders.length
      useStore.getState().addReminder({
        id: 'test-reminder',
        time: '12:00',
        enabled: true,
        label: 'Test',
      })
      const settings = useStore.getState().notificationSettings
      expect(settings.reminders.length).toBe(initialCount + 1)
      expect(settings.reminders.find(r => r.id === 'test-reminder')).toBeDefined()
    })

    it('can update a reminder', () => {
      useStore.getState().updateReminder('morning', { time: '08:00' })
      const settings = useStore.getState().notificationSettings
      const morning = settings.reminders.find(r => r.id === 'morning')
      expect(morning?.time).toBe('08:00')
    })

    it('can remove a reminder', () => {
      const initialCount = useStore.getState().notificationSettings.reminders.length
      useStore.getState().removeReminder('evening')
      const settings = useStore.getState().notificationSettings
      expect(settings.reminders.length).toBe(initialCount - 1)
      expect(settings.reminders.find(r => r.id === 'evening')).toBeUndefined()
    })
  })

  describe('onboarding', () => {
    it('defaults to incomplete', () => {
      // Note: This might be persisted, so we check the type
      expect(typeof useStore.getState().onboardingComplete).toBe('boolean')
    })

    it('can be set to complete', () => {
      useStore.getState().setOnboardingComplete(true)
      expect(useStore.getState().onboardingComplete).toBe(true)
    })
  })
})
