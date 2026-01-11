import { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';
import styles from './SearchBar.module.css';

export function SearchBar() {
  const [isExpanded, setIsExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchEntries = useStore((state) => state.searchEntries);
  const clearSearch = useStore((state) => state.clearSearch);
  const searchResults = useStore((state) => state.searchResults);
  const searchQuery = useStore((state) => state.searchQuery);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  // Debounced search
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

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    setIsExpanded(false);
    setQuery('');
    clearSearch();
  };

  const handleClearQuery = () => {
    setQuery('');
    clearSearch();
    inputRef.current?.focus();
  };

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.searchWrapper}>
        {isExpanded ? (
          <div className={styles.expandedBar}>
            <MagnifyingGlassIcon className={styles.searchIcon} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search entries..."
              className={styles.input}
            />
            {query && (
              <button
                className={styles.clearBtn}
                onClick={handleClearQuery}
                aria-label="Clear search"
              >
                <XMarkIcon className={styles.clearIcon} />
              </button>
            )}
            <button
              className={styles.cancelBtn}
              onClick={handleCollapse}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button className={styles.collapsedBar} onClick={handleExpand}>
            <MagnifyingGlassIcon className={styles.searchIcon} />
            <span className={styles.placeholder}>Search entries...</span>
          </button>
        )}
      </div>

      {searchQuery && isExpanded && (
        <div className={styles.resultsBar}>
          <span className={styles.resultsText}>
            {searchResults.length} {searchResults.length === 1 ? 'entry' : 'entries'} found
          </span>
        </div>
      )}
    </div>
  );
}
