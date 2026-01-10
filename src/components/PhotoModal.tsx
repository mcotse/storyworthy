import { useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import styles from './PhotoModal.module.css';

interface PhotoModalProps {
  photo: string;
  onClose: () => void;
}

export function PhotoModal({ photo, onClose }: PhotoModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <button className={styles.closeBtn} onClick={onClose} aria-label="Close">
        <XMarkIcon className={styles.closeIcon} />
      </button>
      <img
        src={photo}
        alt="Full size photo"
        className={styles.photo}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
