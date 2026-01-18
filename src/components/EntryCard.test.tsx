import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { EntryCard, EmptyCard } from './EntryCard'
import type { Entry } from '../types/entry'

describe('EntryCard', () => {
  const mockEntry: Entry = {
    date: '2024-01-15',
    storyworthy: 'This is a storyworthy moment',
    thankful: 'I am thankful for this',
    createdAt: Date.now(),
  }

  const defaultProps = {
    entry: mockEntry,
    isExpanded: false,
    onToggle: vi.fn(),
    onEdit: vi.fn(),
    onPhotoClick: vi.fn(),
  }

  it('renders collapsed state correctly', () => {
    render(<EntryCard {...defaultProps} />)

    // Should show date
    expect(screen.getByText(/Jan/)).toBeInTheDocument()

    // Should show preview text
    expect(screen.getByText('This is a storyworthy moment')).toBeInTheDocument()
  })

  it('renders expanded state correctly', () => {
    render(<EntryCard {...defaultProps} isExpanded={true} />)

    // Should show full content
    expect(screen.getByText('This is a storyworthy moment')).toBeInTheDocument()
    expect(screen.getByText('I am thankful for this')).toBeInTheDocument()

    // Should show edit button
    expect(screen.getByRole('button', { name: /edit/i })).toBeInTheDocument()
  })

  it('calls onToggle when clicked', () => {
    const onToggle = vi.fn()
    render(<EntryCard {...defaultProps} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('article'))
    expect(onToggle).toHaveBeenCalled()
  })

  it('calls onEdit when edit button clicked', () => {
    const onEdit = vi.fn()
    render(<EntryCard {...defaultProps} isExpanded={true} onEdit={onEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    expect(onEdit).toHaveBeenCalled()
  })

  it('shows thumbnail when photo exists', () => {
    const entryWithPhoto: Entry = {
      ...mockEntry,
      photo: 'data:image/jpeg;base64,/9j/fake',
      thumbnail: 'data:image/jpeg;base64,/9j/thumb',
    }

    const { container } = render(<EntryCard {...defaultProps} entry={entryWithPhoto} />)

    const img = container.querySelector('img')
    expect(img).toBeInTheDocument()
    expect(img?.src).toContain('data:image/jpeg')
  })

  it('shows edited timestamp when modified', () => {
    const editedEntry: Entry = {
      ...mockEntry,
      modifiedAt: Date.now() - 86400000, // 1 day ago
    }

    render(<EntryCard {...defaultProps} entry={editedEntry} isExpanded={true} />)

    expect(screen.getByText(/edited/i)).toBeInTheDocument()
  })
})

describe('EmptyCard', () => {
  it('renders correctly for past dates', () => {
    const onClick = vi.fn()
    render(<EmptyCard date="2024-01-15" onClick={onClick} />)

    expect(screen.getByText('Mon, Jan 15, 2024')).toBeInTheDocument()
    expect(screen.getByText('+ Add')).toBeInTheDocument()
  })

  it('renders correctly for today', () => {
    const onClick = vi.fn()
    render(<EmptyCard date="2024-01-15" onClick={onClick} />)

    expect(screen.getByText('Mon, Jan 15, 2024')).toBeInTheDocument()
    expect(screen.getByText('+ Add')).toBeInTheDocument()
  })

  it('calls onClick when clicked', () => {
    const onClick = vi.fn()
    render(<EmptyCard date="2024-01-15" onClick={onClick} />)

    fireEvent.click(screen.getByRole('article'))
    expect(onClick).toHaveBeenCalled()
  })
})
