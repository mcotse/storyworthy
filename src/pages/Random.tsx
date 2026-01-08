import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import type { Entry } from '../types/entry';
import { EntryForm } from '../components/EntryForm';
import { PhotoModal } from '../components/PhotoModal';
import { formatDateString, getRelativeTime } from '../utils/date';
import styles from './Random.module.css';

export function Random() {
  const [currentEntry, setCurrentEntry] = useState<Entry | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  const entries = useStore((state) => state.entries);
  const getRandomEntry = useStore((state) => state.getRandomEntry);

  const loadRandomEntry = useCallback(() => {
    if (entries.length === 0) return;

    setIsAnimating(true);
    setTimeout(() => {
      const entry = getRandomEntry();
      setCurrentEntry(entry);
      setIsAnimating(false);
    }, 200);
  }, [entries.length, getRandomEntry]);

  useEffect(() => {
    if (!currentEntry && entries.length > 0) {
      loadRandomEntry();
    }
  }, [entries.length, currentEntry, loadRandomEntry]);

  if (showForm && currentEntry) {
    return (
      <EntryForm
        date={currentEntry.date}
        isEdit
        onClose={() => setShowForm(false)}
      />
    );
  }

  if (entries.length === 0) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Random Memory</h1>
        </header>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="16,3 21,3 21,8" />
              <line x1="4" y1="20" x2="21" y2="3" />
              <polyline points="21,16 21,21 16,21" />
              <line x1="15" y1="15" x2="21" y2="21" />
              <line x1="4" y1="4" x2="9" y2="9" />
            </svg>
          </div>
          <h2>No memories yet</h2>
          <p>Create your first entry to see random memories</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1 className={styles.title}>Random Memory</h1>
        {currentEntry && (
          <button
            className={styles.editBtn}
            onClick={() => setShowForm(true)}
            aria-label="Edit entry"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </header>

      <main className={`${styles.main} ${isAnimating ? styles.fadeOut : styles.fadeIn}`}>
        {currentEntry && (
          <article className={styles.card}>
            <p className={styles.date}>{formatDateString(currentEntry.date)}</p>

            {currentEntry.storyworthy && (
              <div className={styles.section}>
                <p className={`entry-text ${styles.text}`}>{currentEntry.storyworthy}</p>
              </div>
            )}

            {currentEntry.thankful && (
              <div className={styles.section}>
                <span className={styles.sectionLabel}>Thankful for</span>
                <p className={`entry-text ${styles.text}`}>{currentEntry.thankful}</p>
              </div>
            )}

            {currentEntry.photo && (
              <div className={styles.photoContainer}>
                <img
                  src={currentEntry.photo}
                  alt="Entry photo"
                  className={styles.photo}
                  onClick={() => setSelectedPhoto(currentEntry.photo!)}
                />
              </div>
            )}

            {currentEntry.modifiedAt && (
              <p className={styles.edited}>
                Edited {getRelativeTime(currentEntry.modifiedAt)}
              </p>
            )}
          </article>
        )}
      </main>

      <div className={styles.footer}>
        <button className="btn-primary" onClick={loadRandomEntry}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1,4 1,10 7,10" />
            <polyline points="23,20 23,14 17,14" />
            <path d="M20.49,9A9,9,0,0,0,5.64,5.64L1,10M23,14l-4.64,4.36A9,9,0,0,1,3.51,15" />
          </svg>
          Shuffle
        </button>
      </div>

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
