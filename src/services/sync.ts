import type { Entry, CloudEntry } from '../types/entry';
import { supabase, isSupabaseConfigured } from './supabase';
import { getCurrentUser } from './auth';
import { getEntry, createEntry, updateEntry, getAllEntries } from './db';

const LAST_SYNC_KEY = 'storyworthy-last-sync';

// Convert local Entry to cloud format
function toCloudEntry(entry: Entry, userId: string): Omit<CloudEntry, 'id'> {
  return {
    user_id: userId,
    date: entry.date,
    storyworthy: entry.storyworthy,
    thankful: entry.thankful,
    photo_url: entry.photoUrl || null,
    thumbnail_url: entry.thumbnailUrl || null,
    created_at: new Date(entry.createdAt).toISOString(),
    modified_at: new Date(entry.modifiedAt || entry.createdAt).toISOString(),
  };
}

// Convert cloud entry to local format
function toLocalEntry(cloud: CloudEntry): Partial<Entry> {
  return {
    date: cloud.date,
    storyworthy: cloud.storyworthy,
    thankful: cloud.thankful,
    photoUrl: cloud.photo_url || undefined,
    thumbnailUrl: cloud.thumbnail_url || undefined,
    createdAt: new Date(cloud.created_at).getTime(),
    modifiedAt: new Date(cloud.modified_at).getTime(),
    cloudId: cloud.id,
    syncedAt: Date.now(),
    pendingSync: false,
  };
}

// Upload photo to Supabase Storage
export async function uploadPhoto(
  userId: string,
  date: string,
  photoBase64: string,
  type: 'photo' | 'thumbnail'
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    // Convert base64 to blob
    const base64Data = photoBase64.split(',')[1];
    const byteCharacters = atob(base64Data);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    const path = `${userId}/${date}/${type}.jpg`;

    const { error } = await supabase.storage
      .from('photos')
      .upload(path, blob, { upsert: true });

    if (error) {
      console.error('Photo upload error:', error);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('photos')
      .getPublicUrl(path);

    return publicUrl;
  } catch (error) {
    console.error('Photo upload error:', error);
    return null;
  }
}

// Delete photo from Supabase Storage
export async function deletePhoto(userId: string, date: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const paths = [
    `${userId}/${date}/photo.jpg`,
    `${userId}/${date}/thumb.jpg`,
  ];

  await supabase.storage.from('photos').remove(paths);
}

// Push a single entry to Supabase
export async function pushEntry(entry: Entry): Promise<{ success: boolean; cloudId?: string }> {
  if (!isSupabaseConfigured()) {
    return { success: false };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { success: false };
  }

  try {
    // Upload photos if present and not already uploaded
    let photoUrl = entry.photoUrl;
    let thumbnailUrl = entry.thumbnailUrl;

    if (entry.photo && !entry.photoUrl) {
      photoUrl = await uploadPhoto(user.id, entry.date, entry.photo, 'photo') || undefined;
    }

    if (entry.thumbnail && !entry.thumbnailUrl) {
      thumbnailUrl = await uploadPhoto(user.id, entry.date, entry.thumbnail, 'thumbnail') || undefined;
    }

    const cloudData = toCloudEntry({ ...entry, photoUrl, thumbnailUrl }, user.id);

    // Upsert entry (insert or update based on user_id + date)
    const { data, error } = await supabase
      .from('entries')
      .upsert(cloudData, { onConflict: 'user_id,date' })
      .select('id')
      .single();

    if (error) {
      console.error('Push entry error:', error);
      return { success: false };
    }

    // Update local entry with cloud metadata
    await updateEntry(entry.date, {
      cloudId: data.id,
      photoUrl,
      thumbnailUrl,
      syncedAt: Date.now(),
      pendingSync: false,
    });

    return { success: true, cloudId: data.id };
  } catch (error) {
    console.error('Push entry error:', error);
    return { success: false };
  }
}

// Pull entries from Supabase modified since given timestamp
export async function pullEntries(since?: number): Promise<Entry[]> {
  if (!isSupabaseConfigured()) {
    return [];
  }

  const user = await getCurrentUser();
  if (!user) {
    return [];
  }

  try {
    let query = supabase
      .from('entries')
      .select('*')
      .eq('user_id', user.id)
      .order('modified_at', { ascending: false });

    if (since) {
      query = query.gt('modified_at', new Date(since).toISOString());
    }

    const { data, error } = await query;

    if (error) {
      console.error('Pull entries error:', error);
      return [];
    }

    return (data as CloudEntry[]).map((cloud) => ({
      ...toLocalEntry(cloud),
      date: cloud.date,
      storyworthy: cloud.storyworthy,
      thankful: cloud.thankful,
      createdAt: new Date(cloud.created_at).getTime(),
    })) as Entry[];
  } catch (error) {
    console.error('Pull entries error:', error);
    return [];
  }
}

// Progress callback type
export type SyncProgressCallback = (progress: {
  phase: 'pulling' | 'pushing';
  current: number;
  total: number;
}) => void;

// Full bidirectional sync
export async function syncAll(
  onProgress?: SyncProgressCallback
): Promise<{ pushed: number; pulled: number; errors: number }> {
  if (!isSupabaseConfigured()) {
    return { pushed: 0, pulled: 0, errors: 0 };
  }

  const user = await getCurrentUser();
  if (!user) {
    return { pushed: 0, pulled: 0, errors: 0 };
  }

  const result = { pushed: 0, pulled: 0, errors: 0 };

  try {
    // Get last sync timestamp
    const lastSyncStr = localStorage.getItem(LAST_SYNC_KEY);
    const lastSync = lastSyncStr ? parseInt(lastSyncStr, 10) : undefined;

    // Pull remote changes
    const remoteEntries = await pullEntries(lastSync);

    for (let i = 0; i < remoteEntries.length; i++) {
      const remote = remoteEntries[i];
      onProgress?.({ phase: 'pulling', current: i + 1, total: remoteEntries.length });

      const local = await getEntry(remote.date);

      if (!local) {
        // New remote entry - create locally
        await createEntry(remote);
        result.pulled++;
      } else if (remote.modifiedAt && local.modifiedAt && remote.modifiedAt > local.modifiedAt) {
        // Remote is newer - update local
        await updateEntry(remote.date, {
          storyworthy: remote.storyworthy,
          thankful: remote.thankful,
          photoUrl: remote.photoUrl,
          thumbnailUrl: remote.thumbnailUrl,
          modifiedAt: remote.modifiedAt,
          cloudId: remote.cloudId,
          syncedAt: Date.now(),
          pendingSync: false,
        });
        result.pulled++;
      }
    }

    // Push local changes (entries with pendingSync = true or no cloudId)
    const localEntries = await getAllEntries();
    const pendingEntries = localEntries.filter((e) => e.pendingSync || !e.cloudId);

    for (let i = 0; i < pendingEntries.length; i++) {
      const entry = pendingEntries[i];
      onProgress?.({ phase: 'pushing', current: i + 1, total: pendingEntries.length });

      const { success } = await pushEntry(entry);
      if (success) {
        result.pushed++;
      } else {
        result.errors++;
      }
    }

    // Update last sync timestamp
    localStorage.setItem(LAST_SYNC_KEY, Date.now().toString());

    return result;
  } catch (error) {
    console.error('Sync error:', error);
    return result;
  }
}

// Get last sync timestamp
export function getLastSyncTime(): number | null {
  const lastSyncStr = localStorage.getItem(LAST_SYNC_KEY);
  return lastSyncStr ? parseInt(lastSyncStr, 10) : null;
}

// Clear sync data (for sign out)
export function clearSyncData(): void {
  localStorage.removeItem(LAST_SYNC_KEY);
}
