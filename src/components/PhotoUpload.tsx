import { useRef, useState } from 'react';
import { compressAndCreateThumbnail } from '../services/compression';
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline';
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

  const processPhoto = async (file: File) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Compress and create thumbnail for app storage
      const { photo, thumbnail } = await compressAndCreateThumbnail(file);
      onPhotoChange(photo, thumbnail);
    } catch (err) {
      setError('Failed to process image. Try a different one.');
      console.error(err);
    } finally {
      setIsProcessing(false);
      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    // Validate file type (allow empty type for iOS HEIC)
    if (file.type && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    await processPhoto(file);
  };

  const handleRemove = () => {
    onPhotoChange(undefined, undefined);
    setError(null);
  };

  const handleClick = () => {
    // Trigger the file input - native OS picker shows camera and gallery options
    fileInputRef.current?.click();
  };


  return (
    <div className={styles.container}>
      {/* File input - native OS picker shows camera and gallery options */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className={styles.input}
        aria-label="Add photo"
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
          aria-label="Add photo"
        >
          {isProcessing ? (
            <span className={styles.spinner} />
          ) : (
            <PlusIcon className={styles.addIcon} />
          )}
        </button>
      )}

      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
