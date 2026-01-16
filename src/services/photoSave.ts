// Service for saving photos to device storage/gallery

import { format } from 'date-fns';

/**
 * Check if the Web Share API with files is supported
 */
export function canShareFiles(): boolean {
  return typeof navigator !== 'undefined' &&
    'share' in navigator &&
    'canShare' in navigator;
}

/**
 * Convert a File to a Blob with a specific filename
 */
function fileToBlob(file: File): Blob {
  return new Blob([file], { type: file.type });
}

/**
 * Save a photo to the device using the best available method:
 * 1. Web Share API (mobile - allows saving to Photos)
 * 2. Download fallback (desktop)
 */
export async function savePhotoToDevice(
  file: File,
  date?: string
): Promise<{ success: boolean; method: 'share' | 'download' | 'error'; error?: string }> {
  const filename = `storyworthy-${date || format(new Date(), 'yyyy-MM-dd')}.jpg`;

  // Try Web Share API first (better on mobile)
  if (canShareFiles()) {
    try {
      const shareFile = new File([file], filename, { type: file.type });
      const shareData = { files: [shareFile] };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { success: true, method: 'share' };
      }
    } catch (error) {
      // User cancelled or share failed - fall through to download
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the share dialog
        return { success: false, method: 'share', error: 'Cancelled' };
      }
      console.warn('Share API failed, falling back to download:', error);
    }
  }

  // Fallback to download
  try {
    const blob = fileToBlob(file);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return { success: true, method: 'download' };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, method: 'error', error: errorMsg };
  }
}

/**
 * Check if we're likely on a mobile device where saving photos makes more sense
 */
export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}
