import imageCompression from 'browser-image-compression';

const COMPRESSION_OPTIONS = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.8,
};

const THUMBNAIL_OPTIONS = {
  maxSizeMB: 0.01,
  maxWidthOrHeight: 120,
  useWebWorker: true,
  fileType: 'image/jpeg' as const,
  initialQuality: 0.7,
};

/**
 * Convert HEIC/HEIF to JPEG using canvas fallback if needed.
 * This handles iOS photos that may not be supported by the compression library.
 */
async function convertToJpegIfNeeded(file: File): Promise<File> {
  const isHeic = file.type === 'image/heic' ||
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif');

  // For HEIC or if file type is empty (common on iOS), try canvas conversion
  if (isHeic || !file.type) {
    try {
      return await convertViaCanvas(file);
    } catch {
      // If canvas conversion fails, return original and let compression handle it
      return file;
    }
  }

  return file;
}

/**
 * Convert image to JPEG using canvas (works for most formats including some HEIC)
 */
async function convertViaCanvas(file: File): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            const convertedFile = new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), {
              type: 'image/jpeg',
            });
            resolve(convertedFile);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/jpeg',
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

export async function compressImage(file: File): Promise<string> {
  try {
    // Try to convert HEIC/problematic formats first
    const processedFile = await convertToJpegIfNeeded(file);
    const compressedFile = await imageCompression(processedFile, COMPRESSION_OPTIONS);
    return await fileToBase64(compressedFile);
  } catch (error) {
    console.error('Image compression failed:', error);
    // Try fallback: direct canvas conversion without compression library
    try {
      console.log('Attempting canvas fallback...');
      const canvasResult = await convertViaCanvas(file);
      return await fileToBase64(canvasResult);
    } catch (fallbackError) {
      console.error('Canvas fallback also failed:', fallbackError);
      throw new Error('Failed to compress image');
    }
  }
}

export async function createThumbnail(file: File): Promise<string> {
  try {
    const processedFile = await convertToJpegIfNeeded(file);
    const compressedFile = await imageCompression(processedFile, THUMBNAIL_OPTIONS);
    return await fileToBase64(compressedFile);
  } catch (error) {
    console.error('Thumbnail creation failed:', error);
    // Try fallback: create thumbnail via canvas
    try {
      console.log('Attempting thumbnail canvas fallback...');
      return await createThumbnailViaCanvas(file);
    } catch (fallbackError) {
      console.error('Thumbnail canvas fallback also failed:', fallbackError);
      throw new Error('Failed to create thumbnail');
    }
  }
}

/**
 * Create thumbnail using canvas as fallback
 */
async function createThumbnailViaCanvas(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const maxSize = 120;
      let width = img.naturalWidth;
      let height = img.naturalHeight;

      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.7));
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image for thumbnail'));
    };

    img.src = url;
  });
}

export async function compressAndCreateThumbnail(file: File): Promise<{ photo: string; thumbnail: string }> {
  const [photo, thumbnail] = await Promise.all([
    compressImage(file),
    createThumbnail(file),
  ]);
  return { photo, thumbnail };
}

function fileToBase64(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
