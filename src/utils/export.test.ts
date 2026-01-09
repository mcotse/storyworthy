import { describe, it, expect } from 'vitest'
import { validateExportFile } from './export'

describe('export utilities', () => {
  describe('validateExportFile', () => {
    it('returns valid for correct format', () => {
      const content = JSON.stringify({
        metadata: {
          version: '1.0',
          exportDate: '2024-01-15T00:00:00.000Z',
          entryCount: 5,
          appName: 'Storyworthy',
        },
        entries: [
          { date: '2024-01-15', storyworthy: 'Test', thankful: 'Test', createdAt: 123 },
        ],
      })
      expect(validateExportFile(content)).toEqual({ valid: true })
    })

    it('returns invalid for missing metadata', () => {
      const content = JSON.stringify({
        entries: [],
      })
      const result = validateExportFile(content)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Missing metadata field')
    })

    it('returns invalid for wrong app name', () => {
      const content = JSON.stringify({
        metadata: {
          appName: 'Other App',
        },
        entries: [],
      })
      const result = validateExportFile(content)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid app export file')
    })

    it('returns invalid for non-array entries', () => {
      const content = JSON.stringify({
        metadata: {
          appName: 'Storyworthy',
        },
        entries: 'not an array',
      })
      const result = validateExportFile(content)
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid entries format')
    })

    it('returns invalid for malformed JSON', () => {
      const result = validateExportFile('not valid json')
      expect(result.valid).toBe(false)
      expect(result.error).toBe('Invalid JSON format')
    })
  })
})
