import type { Entry } from '../types/entry';

const DB_NAME = 'daily-moments-db';
const DB_VERSION = 1;
const STORE_NAME = 'entries';
const DRAFT_STORE = 'drafts';

let db: IDBDatabase | null = null;

export async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Entries store
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'date' });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }

      // Drafts store
      if (!database.objectStoreNames.contains(DRAFT_STORE)) {
        database.createObjectStore(DRAFT_STORE, { keyPath: 'date' });
      }
    };
  });
}

export async function createEntry(entry: Entry): Promise<void> {
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(entry);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
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

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
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
  const database = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME, DRAFT_STORE], 'readwrite');
    const entriesStore = transaction.objectStore(STORE_NAME);
    const draftsStore = transaction.objectStore(DRAFT_STORE);

    entriesStore.clear();
    draftsStore.clear();

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
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
