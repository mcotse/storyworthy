import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
        <MagnifyingGlassIcon className={styles.btnIcon} />
      </button>
    );
  }

  return (
    <div className={styles.expandedContainer}>
      <div className={styles.inputWrapper}>
        <MagnifyingGlassIcon className={styles.icon} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search entries..."
          className={styles.input}
        />
        <button className={styles.closeBtn} onClick={handleClose} aria-label="Close search">
          <XMarkIcon className={styles.closeIcon} />
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
