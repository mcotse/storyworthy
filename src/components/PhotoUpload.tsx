import { useRef, useState } from 'react';
import { compressAndCreateThumbnail } from '../services/compression';
import { savePhotoToDevice, isIOS } from '../services/photoSave';
import { useStore } from '../store';
import { XMarkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import styles from './PhotoUpload.module.css';

interface PhotoUploadProps {
  photo?: string;
  thumbnail?: string;
  date?: string;
  onPhotoChange: (photo: string | undefined, thumbnail: string | undefined) => void;
}

export function PhotoUpload({ photo, thumbnail, date, onPhotoChange }: PhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  const savePhotosToDevice = useStore((state) => state.savePhotosToDevice);
  const savePhotosPromptShown = useStore((state) => state.savePhotosPromptShown);
  const setSavePhotosToDevice = useStore((state) => state.setSavePhotosToDevice);
  const setSavePhotosPromptShown = useStore((state) => state.setSavePhotosPromptShown);
  const addToast = useStore((state) => state.addToast);

  const processPhoto = async (file: File, shouldSaveToDevice: boolean) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Save original to device if enabled
      if (shouldSaveToDevice) {
        const result = await savePhotoToDevice(file, date);
        if (result.success) {
          if (result.method === 'download') {
            addToast('Photo saved to downloads', 'success');
          }
          // For share method on iOS, user handled it via the share sheet
        } else if (result.error !== 'Cancelled') {
          // Don't show error toast if user just cancelled the share sheet
          addToast('Could not save photo to device', 'error');
        }
        // Note: No message for cancelled - that's intentional user action
      }

      // Compress and create thumbnail for app storage
      const { photo, thumbnail } = await compressAndCreateThumbnail(file);
      onPhotoChange(photo, thumbnail);
    } catch (err) {
      setError('Failed to process image. Try a different one.');
      console.error(err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // If prompt hasn't been shown yet, show it
    if (!savePhotosPromptShown) {
      setPendingFile(file);
      setShowPrompt(true);
      return;
    }

    // Otherwise, process with current setting
    await processPhoto(file, savePhotosToDevice);
  };

  const handlePromptResponse = async (enableSave: boolean) => {
    setSavePhotosToDevice(enableSave);
    setSavePhotosPromptShown(true);
    setShowPrompt(false);

    if (pendingFile) {
      await processPhoto(pendingFile, enableSave);
      setPendingFile(null);
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

      {/* First-time prompt modal */}
      {showPrompt && (
        <div className={styles.promptOverlay} onClick={() => setShowPrompt(false)}>
          <div className={styles.promptModal} onClick={(e) => e.stopPropagation()}>
            <h3 className={styles.promptTitle}>Save Photos to Device?</h3>
            <p className={styles.promptText}>
              Would you like to also save photos to your device's gallery?
              This keeps a backup of your original photos outside the app.
              {isIOS() && ' On iOS, tap "Save Image" when the share menu appears.'}
            </p>
            <p className={styles.promptHint}>
              You can change this later in Settings.
            </p>
            <div className={styles.promptButtons}>
              <button
                className="btn-primary"
                onClick={() => handlePromptResponse(true)}
              >
                Yes, Save to Device
              </button>
              <button
                className="btn-secondary"
                onClick={() => handlePromptResponse(false)}
              >
                No, Keep in App Only
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
