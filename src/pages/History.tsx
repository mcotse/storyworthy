import { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useStore } from '../store';
import { EntryCard } from '../components/EntryCard';
import { WeekStack } from '../components/WeekStack';
import { PhotoModal } from '../components/PhotoModal';
import { SearchBar } from '../components/SearchBar';
import { EntryForm } from '../components/EntryForm';
import { ClockIcon } from '@heroicons/react/24/outline';
import { startOfWeek, format } from 'date-fns';
import type { Entry } from '../types/entry';
import styles from './History.module.css';

const PAGE_SIZE = 7;

// Helper to get week key for grouping
function getWeekKey(dateStr: string): string {
  const date = new Date(dateStr);
  const weekStart = startOfWeek(date, { weekStartsOn: 0 }); // Sunday start
  return format(weekStart, 'yyyy-MM-dd');
}

// Helper to get week label for display
function getWeekLabel(weekKey: string): string {
  const weekStart = new Date(weekKey);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);
  return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
}

// Type for display items (can be entry or week group)
type DisplayItem =
  | { type: 'entry'; entry: Entry }
  | { type: 'week'; weekKey: string; weekLabel: string; entries: Entry[] };

export function History() {
  const [editDate, setEditDate] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

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
  const allEntries = useMemo(() => {
    if (searchQuery) {
      return searchResults;
    }

    return entries
      .filter((e) => e.storyworthy || e.thankful)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, searchQuery, searchResults]);

  // Group entries: recent (within 7 days) shown individually, older grouped by week
  const displayItems = useMemo((): DisplayItem[] => {
    if (searchQuery) {
      // When searching, show all results individually
      return allEntries.map((entry) => ({ type: 'entry', entry }));
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentItems: DisplayItem[] = [];
    const weekGroups = new Map<string, Entry[]>();

    allEntries.slice(0, visibleCount * 2).forEach((entry) => {
      const entryDate = new Date(entry.date);
      if (entryDate >= sevenDaysAgo) {
        // Recent entry - show individually
        recentItems.push({ type: 'entry', entry });
      } else {
        // Older entry - group by week
        const weekKey = getWeekKey(entry.date);
        if (!weekGroups.has(weekKey)) {
          weekGroups.set(weekKey, []);
        }
        weekGroups.get(weekKey)!.push(entry);
      }
    });

    // Convert week groups to display items, sorted by week (newest first)
    const weekItems: DisplayItem[] = Array.from(weekGroups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([weekKey, weekEntries]) => ({
        type: 'week',
        weekKey,
        weekLabel: getWeekLabel(weekKey),
        entries: weekEntries.sort((a, b) => b.date.localeCompare(a.date)),
      }));

    return [...recentItems, ...weekItems];
  }, [allEntries, visibleCount, searchQuery]);

  const hasMore = !searchQuery && visibleCount * 2 < allEntries.length;

  // Use refs to track current values for the observer callback
  const isLoadingMoreRef = useRef(isLoadingMore);
  const hasMoreRef = useRef(hasMore);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    isLoadingMoreRef.current = isLoadingMore;
  }, [isLoadingMore]);

  useEffect(() => {
    hasMoreRef.current = hasMore;
  }, [hasMore]);

  // Callback ref for the load more element - sets up observer when element mounts
  const loadMoreCallbackRef = useCallback((node: HTMLDivElement | null) => {
    // Clean up previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }

    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreRef.current && !isLoadingMoreRef.current) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => prev + PAGE_SIZE);
            setIsLoadingMore(false);
          }, 200);
        }
      },
      { threshold: 0.1, rootMargin: '100px' }
    );

    observerRef.current.observe(node);
  }, []);

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
              {displayItems.map((item) =>
                item.type === 'entry' ? (
                  <EntryCard
                    key={item.entry.date}
                    entry={item.entry}
                    isExpanded={expandedCardDate === item.entry.date}
                    onToggle={() =>
                      setExpandedCard(expandedCardDate === item.entry.date ? null : item.entry.date)
                    }
                    onEdit={() => setEditDate(item.entry.date)}
                    onPhotoClick={setSelectedPhoto}
                  />
                ) : (
                  <WeekStack
                    key={item.weekKey}
                    weekLabel={item.weekLabel}
                    entries={item.entries}
                    expandedCardDate={expandedCardDate}
                    onToggleCard={(date) =>
                      setExpandedCard(expandedCardDate === date ? null : date)
                    }
                    onEdit={setEditDate}
                    onPhotoClick={setSelectedPhoto}
                  />
                )
              )}
            </div>

            {/* Load more trigger */}
            {hasMore && (
              <div ref={loadMoreCallbackRef} className={styles.loadMore}>
                {isLoadingMore ? (
                  <div className={styles.loadingSpinner} />
                ) : (
                  <span className={styles.loadMoreText}>Scroll for more</span>
                )}
              </div>
            )}

            {/* End of list indicator */}
            {!hasMore && allEntries.length > PAGE_SIZE && (
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
