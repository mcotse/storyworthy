import { useState } from 'react';
import { ChevronRightIcon } from '@heroicons/react/24/outline';
import { EntryCard } from './EntryCard';
import type { Entry } from '../types/entry';
import styles from './WeekStack.module.css';

interface WeekStackProps {
  weekLabel: string;
  entries: Entry[];
  expandedCardDate: string | null;
  onToggleCard: (date: string) => void;
  onEdit: (date: string) => void;
  onPhotoClick: (photo: string) => void;
}

export function WeekStack({
  weekLabel,
  entries,
  expandedCardDate,
  onToggleCard,
  onEdit,
  onPhotoClick,
}: WeekStackProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Get first few photo thumbnails for preview
  const photoEntries = entries.filter((e) => e.thumbnail || e.photo).slice(0, 3);

  return (
    <div className={`${styles.weekStack} ${isExpanded ? styles.expanded : ''}`}>
      <button
        className={styles.weekHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className={styles.weekInfo}>
          <span className={`${styles.chevron} ${isExpanded ? styles.chevronExpanded : ''}`}>
            <ChevronRightIcon className={styles.chevronIcon} />
          </span>
          <div className={styles.weekText}>
            <span className={styles.weekLabel}>{weekLabel}</span>
            <span className={styles.entryCount}>
              {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
            </span>
          </div>
        </div>

        {photoEntries.length > 0 && (
          <div className={`${styles.previewContainer} ${isExpanded ? styles.previewHidden : ''}`}>
            <div className={styles.photoStack}>
              {photoEntries.map((entry, i) => (
                <img
                  key={entry.date}
                  src={entry.thumbnail || entry.photo}
                  alt=""
                  className={styles.stackPhoto}
                  style={{
                    '--stack-index': i,
                    zIndex: photoEntries.length - i,
                  } as React.CSSProperties}
                />
              ))}
            </div>
          </div>
        )}
      </button>

      <div className={`${styles.entriesContainer} ${isExpanded ? styles.entriesExpanded : ''}`}>
        <div className={styles.entriesInner}>
          <div className={styles.entriesTimeline}>
            {entries.map((entry, index) => (
              <div
                key={entry.date}
                className={styles.entryWrapper}
                style={{ '--entry-index': index } as React.CSSProperties}
              >
                <EntryCard
                  entry={entry}
                  isExpanded={expandedCardDate === entry.date}
                  onToggle={() => onToggleCard(entry.date)}
                  onEdit={() => onEdit(entry.date)}
                  onPhotoClick={onPhotoClick}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
