import type { Entry } from '../types/entry';
import { logger } from './logger';

const DB_NAME = 'daily-moments-db';
const DB_VERSION = 1;
const STORE_NAME = 'entries';
const DRAFT_STORE = 'drafts';

const log = logger.child({ service: 'db' });

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  // Check if IndexedDB is available (disabled in Safari Private Browsing)
  if (!window.indexedDB) {
    log.error('db_init_failed', new Error('IndexedDB not available'), {
      reason: 'indexeddb_unavailable',
    });
    throw new Error('IndexedDB not available. If using Private Browsing, please use normal mode.');
  }

  return new Promise((resolve, reject) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        const error = request.error;
        // Safari Private Browsing throws QuotaExceededError
        if (error?.name === 'QuotaExceededError') {
          log.error('db_init_failed', error, { reason: 'quota_exceeded' });
          reject(new Error('Storage not available. Private Browsing mode may be enabled.'));
        } else {
          log.error('db_init_failed', error, { reason: 'open_error' });
          reject(new Error(`Database error: ${error?.message || 'Unknown error'}`));
        }
      };

      request.onsuccess = () => {
        db = request.result;
        log.info('db_initialized', { version: DB_VERSION });
        resolve(db);
      };

      request.onupgradeneeded = (event) => {
        const database = (event.target as IDBOpenDBRequest).result;
        const oldVersion = event.oldVersion;

        log.info('db_upgrade_started', { old_version: oldVersion, new_version: DB_VERSION });

        // Entries store
        if (!database.objectStoreNames.contains(STORE_NAME)) {
          const store = database.createObjectStore(STORE_NAME, { keyPath: 'date' });
          store.createIndex('createdAt', 'createdAt', { unique: false });
          log.info('db_store_created', { store: STORE_NAME });
        }

        // Drafts store
        if (!database.objectStoreNames.contains(DRAFT_STORE)) {
          database.createObjectStore(DRAFT_STORE, { keyPath: 'date' });
          log.info('db_store_created', { store: DRAFT_STORE });
        }
      };
    } catch (e) {
      log.error('db_init_failed', e, { reason: 'exception' });
      reject(new Error(`Failed to open database: ${e instanceof Error ? e.message : 'Unknown error'}`));
    }
  });
}

export async function createEntry(entry: Entry): Promise<void> {
  const database = await initDB();
  const hasPhoto = Boolean(entry.photo || entry.photoUrl);

  return new Promise((resolve, reject) => {
    try {
      const transaction = database.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(entry);

      request.onerror = () => {
        const error = request.error;
        if (error?.name === 'QuotaExceededError') {
          log.error('entry_save_failed', error, {
            entry_date: entry.date,
            reason: 'quota_exceeded',
            has_photo: hasPhoto,
          });
          reject(new Error('Storage full. Try deleting old entries or photos.'));
        } else {
          log.error('entry_save_failed', error, {
            entry_date: entry.date,
            reason: 'write_error',
          });
          reject(new Error(`Failed to save: ${error?.message || 'Unknown error'}`));
        }
      };
      request.onsuccess = () => {
        log.info('entry_saved', {
          entry_date: entry.date,
          has_photo: hasPhoto,
          pending_sync: entry.pendingSync,
        });
        resolve();
      };

      transaction.onerror = () => {
        log.error('entry_save_failed', transaction.error, {
          entry_date: entry.date,
          reason: 'transaction_error',
        });
        reject(new Error(`Transaction failed: ${transaction.error?.message || 'Unknown error'}`));
      };
    } catch (e) {
      log.error('entry_save_failed', e, {
        entry_date: entry.date,
        reason: 'exception',
      });
      reject(new Error(`Save failed: ${e instanceof Error ? e.message : 'Unknown error'}`));
    }
  });
}

export async function updateEntry(date: string, updates: Partial<Entry>): Promise<void> {
  const existing = await getEntry(date);
  if (!existing) {
    throw new Error('Entry not found');
  }

  const updated: Entry = {
    ...existing,
    ...updates,
    modifiedAt: Date.now(),
  };

  await createEntry(updated);
}

export async function deleteEntry(date: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(date);

    request.onerror = () => {
      log.error('entry_delete_failed', request.error, { entry_date: date });
      reject(request.error);
    };
    request.onsuccess = () => {
      log.info('entry_deleted', { entry_date: date });
      resolve();
    };
  });
}

export async function getEntry(date: string): Promise<Entry | null> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(date);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function getAllEntries(): Promise<Entry[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const entries = request.result || [];
      // Sort by date descending
      entries.sort((a, b) => b.date.localeCompare(a.date));
      resolve(entries);
    };
  });
}

export async function getEntriesInRange(startDate: string, endDate: string): Promise<Entry[]> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const range = IDBKeyRange.bound(startDate, endDate);
    const request = store.getAll(range);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

export async function searchEntries(query: string): Promise<Entry[]> {
  const entries = await getAllEntries();
  const lowerQuery = query.toLowerCase();

  return entries.filter(
    (entry) =>
      entry.storyworthy.toLowerCase().includes(lowerQuery) ||
      entry.thankful.toLowerCase().includes(lowerQuery)
  );
}

export async function getEntryCount(): Promise<number> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.count();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

// Draft management
export async function saveDraft(date: string, draft: Partial<Entry>): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE, 'readwrite');
    const store = transaction.objectStore(DRAFT_STORE);
    const request = store.put({ ...draft, date });

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getDraft(date: string): Promise<Partial<Entry> | null> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE, 'readonly');
    const store = transaction.objectStore(DRAFT_STORE);
    const request = store.get(date);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || null);
  });
}

export async function clearDraft(date: string): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(DRAFT_STORE, 'readwrite');
    const store = transaction.objectStore(DRAFT_STORE);
    const request = store.delete(date);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Clear all data
export async function clearAllData(): Promise<void> {
  log.warn('data_clear_started');
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME, DRAFT_STORE], 'readwrite');
    const entriesStore = transaction.objectStore(STORE_NAME);
    const draftsStore = transaction.objectStore(DRAFT_STORE);

    entriesStore.clear();
    draftsStore.clear();

    transaction.oncomplete = () => {
      log.info('data_cleared');
      resolve();
    };
    transaction.onerror = () => {
      log.error('data_clear_failed', transaction.error);
      reject(transaction.error);
    };
  });
}

// Storage usage estimation
export async function getStorageUsage(): Promise<{ used: number; quota: number }> {
  if (navigator.storage && navigator.storage.estimate) {
    const estimate = await navigator.storage.estimate();
    return {
      used: estimate.usage || 0,
      quota: estimate.quota || 0,
    };
  }
  return { used: 0, quota: 50 * 1024 * 1024 }; // Default 50MB
}
