import { useState } from 'react';
import { ChevronDownIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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

  // Get first photo thumbnail for preview
  const previewEntry = entries.find((e) => e.thumbnail || e.photo);
  const previewPhoto = previewEntry?.thumbnail || previewEntry?.photo;

  return (
    <div className={styles.weekStack}>
      <button
        className={styles.weekHeader}
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
      >
        <div className={styles.weekInfo}>
          <span className={styles.chevron}>
            {isExpanded ? (
              <ChevronDownIcon className={styles.chevronIcon} />
            ) : (
              <ChevronRightIcon className={styles.chevronIcon} />
            )}
          </span>
          <span className={styles.weekLabel}>{weekLabel}</span>
          <span className={styles.entryCount}>{entries.length} {entries.length === 1 ? 'entry' : 'entries'}</span>
        </div>
        {!isExpanded && previewPhoto && (
          <img src={previewPhoto} alt="" className={styles.previewPhoto} />
        )}
        {!isExpanded && !previewPhoto && (
          <div className={styles.stackPreview}>
            {entries.slice(0, 3).map((_, i) => (
              <div
                key={i}
                className={styles.stackCard}
                style={{ transform: `translateY(${i * 4}px)` }}
              />
            ))}
          </div>
        )}
      </button>

      {isExpanded && (
        <div className={styles.entriesContainer}>
          {entries.map((entry) => (
            <EntryCard
              key={entry.date}
              entry={entry}
              isExpanded={expandedCardDate === entry.date}
              onToggle={() => onToggleCard(entry.date)}
              onEdit={() => onEdit(entry.date)}
              onPhotoClick={onPhotoClick}
            />
          ))}
        </div>
      )}
    </div>
  );
}
