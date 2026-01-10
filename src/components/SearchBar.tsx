import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import styles from './SearchBar.module.css';

export function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const searchEntries = useStore((state) => state.searchEntries);
  const clearSearch = useStore((state) => state.clearSearch);
  const searchResults = useStore((state) => state.searchResults);
  const searchQuery = useStore((state) => state.searchQuery);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query.trim()) {
        searchEntries(query);
      } else {
        clearSearch();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query, searchEntries, clearSearch]);

  const handleClose = () => {
    setIsOpen(false);
    setQuery('');
    clearSearch();
  };

  if (!isOpen) {
    return (
      <button
        className={styles.floatingBtn}
        onClick={() => setIsOpen(true)}
        aria-label="Search entries"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
      </button>
    );
  }

  return (
    <div className={styles.expandedContainer}>
      <div className={styles.inputWrapper}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={styles.icon}>
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entries..."
          className={styles.input}
        />
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close search">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      {searchQuery && (
        <p className={styles.results}>
          {searchResults.length} {searchResults.length === 1 ? 'entry' : 'entries'} found
        </p>
      )}
    </div>
  );
}
