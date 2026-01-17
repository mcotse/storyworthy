// Service for saving photos to device storage/gallery

import { format } from 'date-fns';

/**
 * Check if we're on iOS (iPhone, iPad, iPod)
 */
export function isIOS(): boolean {
  if (typeof window === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    // iPad on iOS 13+ reports as Mac
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

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
 * - iOS: Uses Web Share API which shows system share sheet (tap "Save Image")
 * - Android: Uses Web Share API or download fallback
 * - Desktop: Downloads the file
 */
export async function savePhotoToDevice(
  file: File,
  date?: string
): Promise<{ success: boolean; method: 'share' | 'download' | 'error'; error?: string }> {
  const filename = `storyworthy-${date || format(new Date(), 'yyyy-MM-dd')}.jpg`;

  // Use Web Share API on mobile (especially iOS)
  if (canShareFiles()) {
    try {
      const shareFile = new File([file], filename, { type: file.type });
      const shareData = { files: [shareFile] };

      if (navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return { success: true, method: 'share' };
      }
    } catch (error) {
      // User cancelled or share failed
      if (error instanceof Error && error.name === 'AbortError') {
        // User cancelled the share dialog - this is normal, not an error
        return { success: false, method: 'share', error: 'Cancelled' };
      }
      // On iOS, share API errors are common - fall through silently
      if (!isIOS()) {
        console.warn('Share API failed, falling back to download:', error);
      }
    }
  }

  // Fallback to download (better UX on desktop, also works on iOS Safari)
  try {
    const blob = fileToBlob(file);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    // iOS Safari needs these for proper download behavior
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    // Small delay before cleanup for iOS
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
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
  ) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
