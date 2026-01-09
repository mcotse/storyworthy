import { useState, useEffect } from 'react';
import { useStore } from '../store';
import { EntryCard, EmptyCard } from '../components/EntryCard';
import { PhotoModal } from '../components/PhotoModal';
import { SearchBar } from '../components/SearchBar';
import { EntryForm } from '../components/EntryForm';
import { getTodayDateString } from '../utils/date';
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

  const displayedEntries = searchQuery ? searchResults : entries;
  const todayDate = getTodayDateString();
  const hasTodayEntry = entries.some((e) => e.date === todayDate && (e.storyworthy || e.thankful));

  // Show form if it's today and no entry exists
  const shouldShowEmptyToday = !hasTodayEntry && !searchQuery;

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
        ) : entries.length === 0 && !shouldShowEmptyToday ? (
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
            {shouldShowEmptyToday && (
              <EmptyCard date={todayDate} onClick={() => setShowForm(true)} />
            )}

            {displayedEntries.map((entry) => (
              <EntryCard
                key={entry.date}
                entry={entry}
                isExpanded={expandedCardDate === entry.date}
                onToggle={() => setExpandedCard(expandedCardDate === entry.date ? null : entry.date)}
                onEdit={() => setEditDate(entry.date)}
                onPhotoClick={setSelectedPhoto}
              />
            ))}
          </div>
        )}
      </main>

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
