export interface Entry {
  date: string; // ISO date string (YYYY-MM-DD) - PRIMARY KEY
  storyworthy: string;
  thankful: string;
  photo?: string; // Base64 data URL of compressed image (local)
  thumbnail?: string; // 60x60px thumbnail for list view (local)
  createdAt: number; // Unix timestamp
  modifiedAt?: number; // Unix timestamp

  // Sync metadata (optional - only present when cloud sync is enabled)
  cloudId?: string; // UUID from Supabase
  photoUrl?: string; // Supabase Storage URL
  thumbnailUrl?: string; // Supabase Storage URL
  syncedAt?: number; // Unix timestamp of last successful sync
  pendingSync?: boolean; // True if local changes need to be pushed
}

// Entry as stored in Supabase
export interface CloudEntry {
  id: string; // UUID
  user_id: string; // UUID
  date: string; // YYYY-MM-DD
  storyworthy: string;
  thankful: string;
  photo_url: string | null;
  thumbnail_url: string | null;
  created_at: string; // ISO timestamp
  modified_at: string; // ISO timestamp
}

export interface ExportData {
  metadata: {
    version: "1.0" | "2.0";
    exportDate: string;
    entryCount: number;
    appName: "Storyworthy" | "Daily Moments";
    includesPhotos?: boolean;
    photoCount?: number;
  };
  entries: Omit<Entry, 'photo' | 'thumbnail'>[];
}

export interface NotificationSettings {
  morningEnabled: boolean;
  morningTime: string; // HH:mm format
  eveningEnabled: boolean;
  eveningTime: string; // HH:mm format
}

export interface AppSettings {
  notifications: NotificationSettings;
  onboardingComplete: boolean;
  installPromptDismissedAt?: number;
}
