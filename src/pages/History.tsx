import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { EntryCard } from '../components/EntryCard';
import { PhotoModal } from '../components/PhotoModal';
import { SearchBar } from '../components/SearchBar';
import { EntryForm } from '../components/EntryForm';
import { ClockIcon } from '@heroicons/react/24/outline';
import styles from './History.module.css';

export function History() {
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

  // Filter to only completed entries (have storyworthy or thankful content)
  const displayItems = useMemo(() => {
    if (searchQuery) {
      return searchResults;
    }

    return entries
      .filter((e) => e.storyworthy || e.thankful)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [entries, searchQuery, searchResults]);

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
        )}
      </main>

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
