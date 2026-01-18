import type { Entry } from '../types/entry';
import { formatDateString, getRelativeTime } from '../utils/date';
import { PencilSquareIcon } from '@heroicons/react/24/outline';
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
            <PencilSquareIcon className={styles.editIcon} />
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
      <div className={styles.emptyContent}>
        <span className={styles.emptyDate}>{formatDateString(date)}</span>
        <span className={styles.emptyAction}>+ Add</span>
      </div>
    </article>
  );
}
