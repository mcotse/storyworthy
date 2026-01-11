import { useState, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import { EmptyCard } from '../components/EntryCard';
import { PhotoModal } from '../components/PhotoModal';
import { EntryForm } from '../components/EntryForm';
import { getTodayDateString, getAllDatesBetween, formatDateString } from '../utils/date';
import { PencilIcon, ArrowPathIcon, PencilSquareIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import type { Entry } from '../types/entry';
import styles from './Home.module.css';

export function Home() {
  const [createDate, setCreateDate] = useState<string | null>(null);
  const [editDate, setEditDate] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [randomEntry, setRandomEntry] = useState<Entry | null>(null);

  const entries = useStore((state) => state.entries);
  const loadEntries = useStore((state) => state.loadEntries);
  const isLoading = useStore((state) => state.isLoading);
  const getRandomEntry = useStore((state) => state.getRandomEntry);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  const todayDate = getTodayDateString();

  // Get completed entries for random selection
  const completedEntries = useMemo(() => {
    return entries.filter((e) => e.storyworthy || e.thankful);
  }, [entries]);

  // Auto-refresh random entry on mount and when entries change
  useEffect(() => {
    if (completedEntries.length > 0) {
      setRandomEntry(getRandomEntry());
    }
  }, [completedEntries.length, getRandomEntry]);

  // Generate a list of ONLY missing/empty entries
  const missingDates = useMemo(() => {
    const entryMap = new Map(entries.map((e) => [e.date, e]));
    const oldestEntry = entries.length > 0 ? entries[entries.length - 1] : null;

    if (!oldestEntry) {
      // No entries yet, show today as empty
      return [todayDate];
    }

    // Get all dates from oldest entry to today
    const allDates = getAllDatesBetween(oldestEntry.date, todayDate);

    // Filter to ONLY empty dates
    return allDates
      .filter((date) => {
        const entry = entryMap.get(date);
        return !entry || (!entry.storyworthy && !entry.thankful);
      })
      .sort((a, b) => b.localeCompare(a)); // Newest first
  }, [entries, todayDate]);

  const handleShuffle = () => {
    const newEntry = getRandomEntry();
    setRandomEntry(newEntry);
  };

  if (createDate || editDate) {
    return (
      <EntryForm
        date={createDate || editDate || todayDate}
        isEdit={!!editDate}
        onClose={() => {
          setCreateDate(null);
          setEditDate(null);
        }}
      />
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {isLoading ? (
          <div className={styles.loading}>
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
            <div className={styles.skeleton} />
          </div>
        ) : entries.length === 0 ? (
          // First-time user empty state
          <div className={styles.empty}>
            <div className={styles.emptyIcon}>
              <PencilIcon className={styles.emptyIconSvg} />
            </div>
            <h2 className={styles.emptyTitle}>Start your first entry</h2>
            <p className={styles.emptyText}>Begin your journey of capturing daily moments</p>
            <button className="btn-primary" onClick={() => setCreateDate(todayDate)}>
              Create Entry
            </button>
          </div>
        ) : (
          <>
            {/* Missing entries section */}
            {missingDates.length > 0 ? (
              <div className={styles.list}>
                {missingDates.map((date) => (
                  <EmptyCard
                    key={date}
                    date={date}
                    isToday={date === todayDate}
                    onClick={() => setCreateDate(date)}
                  />
                ))}
              </div>
            ) : (
              // All caught up state
              <div className={styles.caughtUp}>
                <CheckCircleIcon className={styles.caughtUpIcon} />
                <h2 className={styles.caughtUpTitle}>All caught up!</h2>
                <p className={styles.caughtUpText}>You've written entries for every day</p>
              </div>
            )}

            {/* Random memory section */}
            {randomEntry && (
              <div className={styles.randomSection}>
                <div className={styles.randomHeader}>
                  <h2 className={styles.randomTitle}>Random Memory</h2>
                  <button
                    className={styles.shuffleBtn}
                    onClick={handleShuffle}
                    aria-label="Shuffle random memory"
                  >
                    <ArrowPathIcon className={styles.shuffleIcon} />
                  </button>
                </div>
                <article className={styles.randomCard}>
                  <header className={styles.randomCardHeader}>
                    <h3 className={styles.randomDate}>{formatDateString(randomEntry.date)}</h3>
                    <button
                      className={styles.editBtn}
                      onClick={() => setEditDate(randomEntry.date)}
                      aria-label="Edit entry"
                    >
                      <PencilSquareIcon className={styles.editIcon} />
                    </button>
                  </header>
                  {randomEntry.storyworthy && (
                    <p className={styles.randomText}>{randomEntry.storyworthy}</p>
                  )}
                  {randomEntry.thankful && (
                    <div className={styles.randomThankful}>
                      <span className={styles.thankfulLabel}>Thankful for</span>
                      <p className={styles.randomText}>{randomEntry.thankful}</p>
                    </div>
                  )}
                  {randomEntry.photo && (
                    <img
                      src={randomEntry.thumbnail || randomEntry.photo}
                      alt=""
                      className={styles.randomPhoto}
                      onClick={() => setSelectedPhoto(randomEntry.photo!)}
                    />
                  )}
                </article>
              </div>
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
