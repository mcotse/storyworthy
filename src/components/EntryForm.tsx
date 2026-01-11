import { useState, useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import type { Entry } from '../types/entry';
import { getTodayDateString, formatDateString } from '../utils/date';
import { saveDraft, getDraft, clearDraft, getEntry } from '../services/db';
import { PhotoUpload } from './PhotoUpload';
import { ChevronLeftIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/outline';
import styles from './EntryForm.module.css';

interface EntryFormProps {
  date?: string;
  onClose: () => void;
  isEdit?: boolean;
}

export function EntryForm({ date = getTodayDateString(), onClose, isEdit = false }: EntryFormProps) {
  const [isClosing, setIsClosing] = useState(false);
  const [storyworthy, setStoryworthy] = useState('');
  const [thankful, setThankful] = useState('');
  const [photo, setPhoto] = useState<string | undefined>();
  const [thumbnail, setThumbnail] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const addEntry = useStore((state) => state.addEntry);
  const updateEntry = useStore((state) => state.updateEntry);
  const deleteEntry = useStore((state) => state.deleteEntry);

  const storyworthyRef = useRef<HTMLTextAreaElement>(null);
  const thankfulRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  const autoResize = (el: HTMLTextAreaElement) => {
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  };

  // Load existing entry or draft
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        if (isEdit) {
          const entry = await getEntry(date);
          if (entry) {
            setStoryworthy(entry.storyworthy || '');
            setThankful(entry.thankful || '');
            setPhoto(entry.photo);
            setThumbnail(entry.thumbnail);
          }
        } else {
          // Check for existing entry first
          const existing = await getEntry(date);
          if (existing) {
            setStoryworthy(existing.storyworthy || '');
            setThankful(existing.thankful || '');
            setPhoto(existing.photo);
            setThumbnail(existing.thumbnail);
          } else {
            // Check for draft
            const draft = await getDraft(date);
            if (draft) {
              setStoryworthy(draft.storyworthy || '');
              setThankful(draft.thankful || '');
              setPhoto(draft.photo);
              setThumbnail(draft.thumbnail);
            }
          }
        }
      } catch (err) {
        console.error('Failed to load entry:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [date, isEdit]);

  // Auto-resize textareas on content change
  useEffect(() => {
    if (storyworthyRef.current) autoResize(storyworthyRef.current);
  }, [storyworthy]);

  useEffect(() => {
    if (thankfulRef.current) autoResize(thankfulRef.current);
  }, [thankful]);

  // Auto-save draft
  const saveDraftDebounced = useCallback(async () => {
    if (isEdit) return; // Don't save drafts when editing

    try {
      await saveDraft(date, { storyworthy, thankful, photo, thumbnail });
    } catch (err) {
      console.error('Failed to save draft:', err);
    }
  }, [date, storyworthy, thankful, photo, thumbnail, isEdit]);

  useEffect(() => {
    const timer = setTimeout(saveDraftDebounced, 2000);
    return () => clearTimeout(timer);
  }, [saveDraftDebounced]);

  const handlePhotoChange = (newPhoto: string | undefined, newThumbnail: string | undefined) => {
    setPhoto(newPhoto);
    setThumbnail(newThumbnail);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!storyworthy.trim() && !thankful.trim()) {
      setError('Please fill in at least one field');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const entry: Entry = {
        date,
        storyworthy: storyworthy.trim(),
        thankful: thankful.trim(),
        photo,
        thumbnail,
        createdAt: Date.now(),
      };

      if (isEdit) {
        await updateEntry(date, entry);
      } else {
        await addEntry(entry);
        await clearDraft(date);
      }

      handleClose();
    } catch (err) {
      // Display detailed error message
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this entry? This cannot be undone.')) return;

    try {
      await deleteEntry(date);
      handleClose();
    } catch (err) {
      setError('Failed to delete entry.');
      console.error(err);
    }
  };

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 120); // Match animation duration
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  const canSave = storyworthy.trim() || thankful.trim();

  return (
    <div className={`${styles.container} ${isClosing ? styles.closing : styles.opening}`}>
      <header className={styles.header}>
        <button type="button" className={styles.backBtn} onClick={handleClose}>
          <ChevronLeftIcon className={styles.backIcon} />
        </button>
        <h1 className={styles.title}>
          {isEdit ? 'Edit Entry' : formatDateString(date)}
        </h1>
        {isEdit && (
          <button type="button" className={styles.deleteBtn} onClick={handleDelete}>
            <TrashIcon className={styles.deleteIcon} />
          </button>
        )}
      </header>

      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label htmlFor="storyworthy" className={styles.label}>
            What's the storyworthy moment of today?
          </label>
          <textarea
            ref={storyworthyRef}
            id="storyworthy"
            value={storyworthy}
            onChange={(e) => setStoryworthy(e.target.value)}
            placeholder="Write your moment..."
            className={`${styles.textarea} ${error && !storyworthy.trim() && !thankful.trim() ? styles.errorBorder : ''}`}
          />
          {storyworthy.length > 1000 && (
            <p className={styles.warning}>Consider keeping entries concise</p>
          )}
        </div>

        <div className={styles.field}>
          <label htmlFor="thankful" className={styles.label}>
            What are you thankful for today?
          </label>
          <textarea
            ref={thankfulRef}
            id="thankful"
            value={thankful}
            onChange={(e) => setThankful(e.target.value)}
            placeholder="Write what you're grateful for..."
            className={`${styles.textarea} ${error && !storyworthy.trim() && !thankful.trim() ? styles.errorBorder : ''}`}
          />
        </div>

        <PhotoUpload
          photo={photo}
          thumbnail={thumbnail}
          onPhotoChange={handlePhotoChange}
        />

        {error && <p className={styles.error}>{error}</p>}
      </form>

      <button
        type="button"
        className={`${styles.fab} ${canSave ? styles.fabActive : ''}`}
        onClick={handleSubmit}
        disabled={isSaving || !canSave}
        aria-label="Save entry"
      >
        {isSaving ? (
          <span className={styles.fabSpinner} />
        ) : (
          <CheckIcon className={styles.fabIcon} />
        )}
      </button>
    </div>
  );
}
