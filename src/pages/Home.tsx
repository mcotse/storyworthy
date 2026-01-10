import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { EntryCard, EmptyCard } from '../components/EntryCard';
import { PhotoModal } from '../components/PhotoModal';
import { SearchBar } from '../components/SearchBar';
import { EntryForm } from '../components/EntryForm';
import { getTodayDateString, getAllDatesBetween } from '../utils/date';
import styles from './Home.module.css';

export function Home() {
  const [showForm, setShowForm] = useState(false);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

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

  const todayDate = getTodayDateString();

  // Generate a list of all dates from oldest entry to today with entries and gaps
  const displayItems = useMemo(() => {
    // If searching, just show search results
    if (searchQuery) {
      return searchResults.map((entry) => ({ type: 'entry' as const, date: entry.date, entry }));
    }

    // Create a map of dates to entries for quick lookup
    const entryMap = new Map(entries.map((e) => [e.date, e]));

    // Find the oldest entry date
    const oldestEntry = entries.length > 0 ? entries[entries.length - 1] : null;
    if (!oldestEntry) {
      // No entries yet, just show today as empty
      return [{ type: 'empty' as const, date: todayDate }];
    }

    // Get all dates from oldest entry to today
    const allDates = getAllDatesBetween(oldestEntry.date, todayDate);

    // Create display items (newest first)
    return allDates
      .sort((a, b) => b.localeCompare(a))
      .map((date) => {
        const entry = entryMap.get(date);
        if (entry && (entry.storyworthy || entry.thankful)) {
          return { type: 'entry' as const, date, entry };
        }
        return { type: 'empty' as const, date };
      });
  }, [entries, searchQuery, searchResults, todayDate]);

  if (showForm || editDate) {
    return (
      <EntryForm
        date={editDate || todayDate}
        isEdit={!!editDate}
        onClose={() => {
          setShowForm(false);
          setEditDate(null);
        }}
      />
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Storyworthy</h1>
        <SearchBar />
      </header>

      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </div>
        ) : entries.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </div>
            <h2 className={styles.emptyTitle}>Start your first entry</h2>
            <p className={styles.emptyText}>Begin your journey of capturing daily moments</p>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              Create Entry
            </button>
          </div>
        ) : (
          <div className={styles.list}>
            {displayItems.map((item) =>
              item.type === 'entry' ? (
                <EntryCard
                  key={item.date}
                  entry={item.entry}
                  isExpanded={expandedCardDate === item.date}
                  onToggle={() => setExpandedCard(expandedCardDate === item.date ? null : item.date)}
                  onEdit={() => setEditDate(item.date)}
                  onPhotoClick={setSelectedPhoto}
                />
              ) : (
                <EmptyCard
                  key={item.date}
                  date={item.date}
                  isToday={item.date === todayDate}
                  onClick={() => setEditDate(item.date)}
                />
              )
            )}
          </div>
        )}
      </main>

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
