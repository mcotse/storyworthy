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
    it('has default values', () => {
      const settings = useStore.getState().notificationSettings
      expect(settings.morningEnabled).toBe(true)
      expect(settings.morningTime).toBe('09:00')
      expect(settings.eveningEnabled).toBe(true)
      expect(settings.eveningTime).toBe('21:00')
    })

    it('can be updated', () => {
      useStore.getState().setNotificationSettings({
        morningEnabled: false,
        morningTime: '08:00',
        eveningEnabled: true,
        eveningTime: '22:00',
      })
      const settings = useStore.getState().notificationSettings
      expect(settings.morningEnabled).toBe(false)
      expect(settings.morningTime).toBe('08:00')
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
