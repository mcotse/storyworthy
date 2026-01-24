import { useRef, useState } from 'react';
import { compressAndCreateThumbnail } from '../services/compression';
import { savePhotoToDevice, isIOS, isMobileDevice } from '../services/photoSave';
import { useStore } from '../store';
import { XMarkIcon, PhotoIcon, CameraIcon, PlusIcon } from '@heroicons/react/24/outline';
import styles from './PhotoUpload.module.css';

interface PhotoUploadProps {
  photo?: string;
  thumbnail?: string;
  date?: string;
  onPhotoChange: (photo: string | undefined, thumbnail: string | undefined) => void;
}

export function PhotoUpload({ photo, thumbnail, date, onPhotoChange }: PhotoUploadProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showSourcePicker, setShowSourcePicker] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [sourceType, setSourceType] = useState<'camera' | 'gallery' | null>(null);

  const savePhotosToDevice = useStore((state) => state.savePhotosToDevice);
  const savePhotosPromptShown = useStore((state) => state.savePhotosPromptShown);
  const setSavePhotosToDevice = useStore((state) => state.setSavePhotosToDevice);
  const setSavePhotosPromptShown = useStore((state) => state.setSavePhotosPromptShown);
  const addToast = useStore((state) => state.addToast);

  const processPhoto = async (file: File, shouldSaveToDevice: boolean, fromCamera: boolean) => {
    setIsProcessing(true);
    setError(null);

    try {
      // Save original to device if enabled AND photo is from camera
      // (No need to save gallery photos back to gallery)
      if (shouldSaveToDevice && fromCamera) {
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
      setSourceType(null);
      // Reset the file inputs
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
      }
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
      }
    }
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>, fromCamera: boolean) => {
    const file = event.target.files?.[0];
    if (!file) {
      setSourceType(null);
      return;
    }

    // Validate file type (allow empty type for iOS HEIC)
    if (file.type && !file.type.startsWith('image/')) {
      setError('Please select an image file');
      setSourceType(null);
      return;
    }

    // If photo is from camera and save prompt hasn't been shown yet, show it
    if (fromCamera && !savePhotosPromptShown) {
      setPendingFile(file);
      setSourceType('camera');
      setShowPrompt(true);
      return;
    }

    // Otherwise, process with current setting
    await processPhoto(file, savePhotosToDevice, fromCamera);
  };

  const handlePromptResponse = async (enableSave: boolean) => {
    setSavePhotosToDevice(enableSave);
    setSavePhotosPromptShown(true);
    setShowPrompt(false);

    if (pendingFile) {
      await processPhoto(pendingFile, enableSave, sourceType === 'camera');
      setPendingFile(null);
    }
  };

  const handleRemove = () => {
    onPhotoChange(undefined, undefined);
    setError(null);
  };

  const handleClick = () => {
    // On iOS, skip our custom picker - iOS shows its own native picker
    // with "Take Photo" and "Choose from Library" options
    if (isIOS()) {
      galleryInputRef.current?.click();
    } else if (isMobileDevice()) {
      // On Android, show our source picker
      setShowSourcePicker(true);
    } else {
      // On desktop, just open file picker (no camera)
      galleryInputRef.current?.click();
    }
  };

  const handleSourceSelect = (source: 'camera' | 'gallery') => {
    setShowSourcePicker(false);
    setSourceType(source);
    if (source === 'camera') {
      cameraInputRef.current?.click();
    } else {
      galleryInputRef.current?.click();
    }
  };

  return (
    <div className={styles.container}>
      {/* Camera input - with capture attribute */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={(e) => handleFileSelect(e, true)}
        className={styles.input}
        aria-label="Take photo with camera"
      />

      {/* Gallery input - without capture attribute */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => handleFileSelect(e, false)}
        className={styles.input}
        aria-label="Choose photo from gallery"
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

      {/* Source picker modal (Take Photo / Choose Photo) */}
      {showSourcePicker && (
        <div className={styles.promptOverlay} onClick={() => setShowSourcePicker(false)}>
          <div className={styles.sourcePickerModal} onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className={styles.sourceOption}
              onClick={() => handleSourceSelect('camera')}
            >
              <CameraIcon className={styles.sourceIcon} />
              <span>Take Photo</span>
            </button>
            <div className={styles.sourceDivider} />
            <button
              type="button"
              className={styles.sourceOption}
              onClick={() => handleSourceSelect('gallery')}
            >
              <PhotoIcon className={styles.sourceIcon} />
              <span>Choose Photo</span>
            </button>
          </div>
        </div>
      )}

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
