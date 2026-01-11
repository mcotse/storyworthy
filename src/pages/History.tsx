import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { EntryCard } from '../components/EntryCard';
import { PhotoModal } from '../components/PhotoModal';
import { SearchBar } from '../components/SearchBar';
import { EntryForm } from '../components/EntryForm';
import { ClockIcon } from '@heroicons/react/24/outline';
import styles from './History.module.css';

const PAGE_SIZE = 7;

export function History() {
  const [editDate, setEditDate] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const entries = useStore((state) => state.entries);
  const searchQuery = useStore((state) => state.searchQuery);
  const searchResults = useStore((state) => state.searchResults);
  const expandedCardDate = useStore((state) => state.expandedCardDate);
  const setExpandedCard = useStore((state) => state.setExpandedCard);
  const loadEntries = useStore((state) => state.loadEntries);
  const isLoading = useStore((state) => state.isLoading);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Reset visible count when search changes
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery]);

  // Filter to only completed entries (have storyworthy or thankful content)
  const allItems = useMemo(() => {
    if (searchQuery) {
      return searchResults;
    }

    return entries
      .filter((e) => e.storyworthy || e.thankful)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, searchQuery, searchResults]);

  // Paginated items (only when not searching)
  const displayItems = useMemo(() => {
    if (searchQuery) {
      return allItems; // Show all search results
    }
    return allItems.slice(0, visibleCount);
  }, [allItems, visibleCount, searchQuery]);

  const hasMore = !searchQuery && visibleCount < allItems.length;

  // Load more when scrolling to bottom
  const loadMore = useCallback(() => {
    if (isLoadingMore || !hasMore) return;

    setIsLoadingMore(true);
    // Small delay to show loading state
    setTimeout(() => {
      setVisibleCount((prev) => prev + PAGE_SIZE);
      setIsLoadingMore(false);
    }, 200);
  }, [isLoadingMore, hasMore]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          loadMore();
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = loadMoreRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasMore, loadMore]);

  if (editDate) {
    return (
      <EntryForm
        date={editDate}
        isEdit={true}
        onClose={() => setEditDate(null)}
      />
    );
  }

  return (
    <div className={styles.container}>
      <SearchBar />

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </div>
        ) : displayItems.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <ClockIcon className={styles.emptyIconSvg} />
            </div>
            <h2 className={styles.emptyTitle}>
              {searchQuery ? 'No results found' : 'No memories yet'}
            </h2>
            <p className={styles.emptyText}>
              {searchQuery
                ? 'Try a different search term'
                : 'Start writing entries to build your history'}
            </p>
          </div>
        ) : (
          <>
            <div className={styles.list}>
              {displayItems.map((entry) => (
                <EntryCard
                  key={entry.date}
                  entry={entry}
                  isExpanded={expandedCardDate === entry.date}
                  onToggle={() =>
                    setExpandedCard(expandedCardDate === entry.date ? null : entry.date)
                  }
                  onEdit={() => setEditDate(entry.date)}
                  onPhotoClick={setSelectedPhoto}
                />
              ))}
            </div>

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreRef} className={styles.loadMore}>
                {isLoadingMore ? (
                  <div className={styles.loadingSpinner} />
                ) : (
                  <span className={styles.loadMoreText}>Scroll for more</span>
                )}
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && allItems.length > PAGE_SIZE && (
              <p className={styles.endOfList}>
                You've reached the beginning
              </p>
            )}
          </>
        )}
      </main>

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
