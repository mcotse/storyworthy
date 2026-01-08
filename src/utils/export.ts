import type { Entry, ExportData } from '../types/entry';
import { getAllEntries, createEntry, getEntry } from '../services/db';
import { format } from 'date-fns';

export async function exportData(): Promise<void> {
  const entries = await getAllEntries();

  const exportData: ExportData = {
    metadata: {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entryCount: entries.length,
      appName: 'Daily Moments',
    },
    entries: entries.map(({ photo, thumbnail, ...rest }) => rest),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `daily-moments-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function importData(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const content = event.target?.result as string;
        const data = JSON.parse(content) as ExportData;

        // Validate structure
        if (!data.metadata || !data.entries || !Array.isArray(data.entries)) {
          throw new Error('Invalid file format');
        }

        if (data.metadata.appName !== 'Daily Moments') {
          throw new Error('Invalid app export file');
        }

        let importedCount = 0;

        for (const entry of data.entries) {
          // Skip if entry already exists
          const existing = await getEntry(entry.date);
          if (existing) continue;

          // Create the entry
          const newEntry: Entry = {
            date: entry.date,
            storyworthy: entry.storyworthy || '',
            thankful: entry.thankful || '',
            createdAt: entry.createdAt || Date.now(),
            modifiedAt: entry.modifiedAt,
          };

          await createEntry(newEntry);
          importedCount++;
        }

        resolve(importedCount);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

export function validateExportFile(content: string): { valid: boolean; error?: string } {
  try {
    const data = JSON.parse(content);

    if (!data.metadata) {
      return { valid: false, error: 'Missing metadata field' };
    }

    if (data.metadata.appName !== 'Daily Moments') {
      return { valid: false, error: 'Invalid app export file' };
    }

    if (!Array.isArray(data.entries)) {
      return { valid: false, error: 'Invalid entries format' };
    }

    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid JSON format' };
  }
}
