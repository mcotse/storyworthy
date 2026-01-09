export interface Entry {
  date: string; // ISO date string (YYYY-MM-DD) - PRIMARY KEY
  storyworthy: string;
  thankful: string;
  photo?: string; // Base64 data URL of compressed image
  thumbnail?: string; // 60x60px thumbnail for list view
  createdAt: number; // Unix timestamp
  modifiedAt?: number; // Unix timestamp
}

export interface ExportData {
  metadata: {
    version: "1.0";
    exportDate: string;
    entryCount: number;
    appName: "Storyworthy" | "Daily Moments";
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
