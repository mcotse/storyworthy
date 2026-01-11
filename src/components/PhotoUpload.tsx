import { useRef, useState } from 'react';
import { compressAndCreateThumbnail } from '../services/compression';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
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
            <XMarkIcon className={styles.removeIcon} />
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
            <PhotoIcon className={styles.addIcon} />
          )}
          <span>{isProcessing ? 'Processing...' : 'Add Photo'}</span>
        </button>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
