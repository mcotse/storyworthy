import type { Entry, ExportData } from '../types/entry';
import { getAllEntries, createEntry, getEntry, updateEntry } from '../services/db';
import { format } from 'date-fns';
import JSZip from 'jszip';

export async function exportData(): Promise<void> {
  const entries = await getAllEntries();

  const exportData: ExportData = {
    metadata: {
      version: '1.0',
      exportDate: new Date().toISOString(),
      entryCount: entries.length,
      appName: 'Storyworthy',
    },
    entries: entries.map(({ photo, thumbnail, ...rest }) => rest),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], {
    type: 'application/json',
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `storyworthy-export-${format(new Date(), 'yyyy-MM-dd')}.json`;
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

        if (data.metadata.appName !== 'Storyworthy' && data.metadata.appName !== 'Daily Moments') {
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

    if (data.metadata.appName !== 'Storyworthy' && data.metadata.appName !== 'Daily Moments') {
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

// Convert base64 data URL to Blob
function base64ToBlob(base64: string): Blob {
  const parts = base64.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const data = atob(parts[1]);
  const array = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    array[i] = data.charCodeAt(i);
  }
  return new Blob([array], { type: mime });
}

// Convert Blob to base64 data URL
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Export data with photos as a ZIP file
export async function exportDataWithPhotos(
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const entries = await getAllEntries();
  const zip = new JSZip();

  let photoCount = 0;
  let processed = 0;

  // Create photos folder
  const photosFolder = zip.folder('photos');

  // Add photos to ZIP
  for (const entry of entries) {
    if (entry.photo) {
      const blob = base64ToBlob(entry.photo);
      photosFolder?.file(`${entry.date}.jpg`, blob);
      photoCount++;
    }
    if (entry.thumbnail) {
      const blob = base64ToBlob(entry.thumbnail);
      photosFolder?.file(`${entry.date}_thumb.jpg`, blob);
    }
    processed++;
    onProgress?.(processed, entries.length);
  }

  // Create entries.json (without base64 photo data)
  const exportData: ExportData = {
    metadata: {
      version: '2.0',
      exportDate: new Date().toISOString(),
      entryCount: entries.length,
      appName: 'Storyworthy',
      includesPhotos: true,
      photoCount,
    },
    entries: entries.map(({ photo, thumbnail, ...rest }) => ({
      ...rest,
      // Include flags to indicate photos exist
      hasPhoto: !!photo,
      hasThumbnail: !!thumbnail,
    })),
  };

  zip.file('entries.json', JSON.stringify(exportData, null, 2));

  // Generate and download ZIP
  const blob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `storyworthy-export-${format(new Date(), 'yyyy-MM-dd')}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Import data from ZIP file (with photos)
export async function importDataWithPhotos(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  const zip = await JSZip.loadAsync(file);

  // Find and parse entries.json
  const entriesFile = zip.file('entries.json');
  if (!entriesFile) {
    throw new Error('Invalid ZIP: missing entries.json');
  }

  const content = await entriesFile.async('string');
  const data = JSON.parse(content) as ExportData & {
    entries: (ExportData['entries'][0] & { hasPhoto?: boolean; hasThumbnail?: boolean })[]
  };

  // Validate structure
  if (!data.metadata || !data.entries || !Array.isArray(data.entries)) {
    throw new Error('Invalid file format');
  }

  if (data.metadata.appName !== 'Storyworthy' && data.metadata.appName !== 'Daily Moments') {
    throw new Error('Invalid app export file');
  }

  let importedCount = 0;
  const total = data.entries.length;

  for (let i = 0; i < data.entries.length; i++) {
    const entry = data.entries[i];
    onProgress?.(i + 1, total);

    // Check if entry already exists
    const existing = await getEntry(entry.date);

    // Load photos from ZIP if they exist
    let photo: string | undefined;
    let thumbnail: string | undefined;

    if (entry.hasPhoto || data.metadata.includesPhotos) {
      const photoFile = zip.file(`photos/${entry.date}.jpg`);
      if (photoFile) {
        const photoBlob = await photoFile.async('blob');
        photo = await blobToBase64(photoBlob);
      }
    }

    if (entry.hasThumbnail || data.metadata.includesPhotos) {
      const thumbFile = zip.file(`photos/${entry.date}_thumb.jpg`);
      if (thumbFile) {
        const thumbBlob = await thumbFile.async('blob');
        thumbnail = await blobToBase64(thumbBlob);
      }
    }

    if (existing) {
      // Update existing entry if it's missing photos and we have them
      if ((photo && !existing.photo) || (thumbnail && !existing.thumbnail)) {
        await updateEntry(entry.date, {
          ...(photo && !existing.photo ? { photo } : {}),
          ...(thumbnail && !existing.thumbnail ? { thumbnail } : {}),
        });
      }
      continue;
    }

    // Create new entry
    const newEntry: Entry = {
      date: entry.date,
      storyworthy: entry.storyworthy || '',
      thankful: entry.thankful || '',
      createdAt: entry.createdAt || Date.now(),
      modifiedAt: entry.modifiedAt,
      photo,
      thumbnail,
    };

    await createEntry(newEntry);
    importedCount++;
  }

  return importedCount;
}

// Detect file type and import accordingly
export async function importDataAuto(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<number> {
  if (file.name.endsWith('.zip')) {
    return importDataWithPhotos(file, onProgress);
  } else {
    return importData(file);
  }
}
