import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock IndexedDB
const indexedDB = {
  open: vi.fn(() => ({
    result: {
      createObjectStore: vi.fn(),
      transaction: vi.fn(() => ({
        objectStore: vi.fn(() => ({
          put: vi.fn(),
          get: vi.fn(),
          delete: vi.fn(),
          getAll: vi.fn(),
          count: vi.fn(),
          clear: vi.fn(),
        })),
      })),
    },
    onerror: null,
    onsuccess: null,
    onupgradeneeded: null,
  })),
}

vi.stubGlobal('indexedDB', indexedDB)

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock Notification API
vi.stubGlobal('Notification', {
  permission: 'default',
  requestPermission: vi.fn().mockResolvedValue('granted'),
})

// Mock navigator.storage
Object.defineProperty(navigator, 'storage', {
  value: {
    estimate: vi.fn().mockResolvedValue({ usage: 1000000, quota: 50000000 }),
  },
  writable: true,
})

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
}
vi.stubGlobal('localStorage', localStorageMock)
