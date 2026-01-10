import { useState, useEffect, useCallback } from 'react';
import { useStore } from '../store';
import type { Entry } from '../types/entry';
import { EntryForm } from '../components/EntryForm';
import { PhotoModal } from '../components/PhotoModal';
import { formatDateString, getRelativeTime } from '../utils/date';
import { ArrowsRightLeftIcon, PencilSquareIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
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
            <ArrowsRightLeftIcon className={styles.emptyIconSvg} />
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
            <PencilSquareIcon className={styles.editIcon} />
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
          <ArrowPathIcon className={styles.shuffleIcon} />
          Shuffle
        </button>
      </div>

      {selectedPhoto && (
        <PhotoModal photo={selectedPhoto} onClose={() => setSelectedPhoto(null)} />
      )}
    </div>
  );
}
