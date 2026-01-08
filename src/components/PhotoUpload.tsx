import { useRef, useState } from 'react';
import { compressAndCreateThumbnail } from '../services/compression';
import styles from './PhotoUpload.module.css';

interface PhotoUploadProps {
  photo?: string;
  thumbnail?: string;
  onPhotoChange: (photo: string | undefined, thumbnail: string | undefined) => void;
}

export function PhotoUpload({ photo, thumbnail, onPhotoChange }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { photo, thumbnail } = await compressAndCreateThumbnail(file);
      onPhotoChange(photo, thumbnail);
    } catch (err) {
      setError('Failed to process image. Try a different one.');
      console.error(err);
    } finally {
      setIsProcessing(false);
      // Reset input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onPhotoChange(undefined, undefined);
    setError(null);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={styles.container}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className={styles.input}
        aria-label="Upload photo"
      />

      {photo || thumbnail ? (
        <div className={styles.preview}>
          <img
            src={thumbnail || photo}
            alt="Attached photo"
            className={styles.thumbnail}
          />
          <button
            type="button"
            className={styles.removeBtn}
            onClick={handleRemove}
            aria-label="Remove photo"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ) : (
        <button
          type="button"
          className={styles.addBtn}
          onClick={handleClick}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className={styles.spinner} />
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21,15 16,10 5,21" />
            </svg>
          )}
          <span>{isProcessing ? 'Processing...' : 'Add Photo'}</span>
        </button>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
