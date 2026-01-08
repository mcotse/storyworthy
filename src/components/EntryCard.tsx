import type { Entry } from '../types/entry';
import { formatDateString, getRelativeTime } from '../utils/date';
import styles from './EntryCard.module.css';

interface EntryCardProps {
  entry: Entry;
  isExpanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onPhotoClick: (photo: string) => void;
}

export function EntryCard({ entry, isExpanded, onToggle, onEdit, onPhotoClick }: EntryCardProps) {
  const hasPhoto = !!entry.photo || !!entry.thumbnail;

  return (
    <article
      className={`${styles.card} ${isExpanded ? styles.expanded : ''}`}
      onClick={onToggle}
    >
      <header className={styles.header}>
        <h3 className={styles.date}>{formatDateString(entry.date)}</h3>
        {isExpanded && (
          <button
            className={styles.editBtn}
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label="Edit entry"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
        )}
      </header>

      {isExpanded ? (
        <div className={styles.content}>
          {entry.storyworthy && (
            <div className={styles.section}>
              <p className={`entry-text ${styles.text}`}>{entry.storyworthy}</p>
            </div>
          )}

          {entry.thankful && (
            <div className={styles.section}>
              <span className={styles.sectionLabel}>Thankful for</span>
              <p className={`entry-text ${styles.text}`}>{entry.thankful}</p>
            </div>
          )}

          {entry.photo && (
            <div className={styles.photoContainer}>
              <img
                src={entry.photo}
                alt="Entry photo"
                className={styles.photo}
                onClick={(e) => {
                  e.stopPropagation();
                  onPhotoClick(entry.photo!);
                }}
              />
            </div>
          )}

          {entry.modifiedAt && (
            <p className={styles.edited}>
              Edited {getRelativeTime(entry.modifiedAt)}
            </p>
          )}
        </div>
      ) : (
        <div className={styles.preview}>
          <p className={styles.previewText}>
            {entry.storyworthy || entry.thankful}
          </p>
          {hasPhoto && (
            <img
              src={entry.thumbnail || entry.photo}
              alt=""
              className={styles.thumbnail}
            />
          )}
        </div>
      )}
    </article>
  );
}

// Empty state card for days without entries
interface EmptyCardProps {
  date: string;
  onClick: () => void;
}

export function EmptyCard({ date, onClick }: EmptyCardProps) {
  return (
    <article className={`${styles.card} ${styles.empty}`} onClick={onClick}>
      <header className={styles.header}>
        <h3 className={styles.date}>
          {formatDateString(date)}
          <span className={styles.badge}>1</span>
        </h3>
      </header>
      <p className={styles.emptyText}>Tap to create today's entry</p>
    </article>
  );
}
