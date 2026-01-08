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

export async function compressImage(file: File): Promise<string> {
  try {
    const compressedFile = await imageCompression(file, COMPRESSION_OPTIONS);
    return await fileToBase64(compressedFile);
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error('Failed to compress image');
  }
}

export async function createThumbnail(file: File): Promise<string> {
  try {
    const compressedFile = await imageCompression(file, THUMBNAIL_OPTIONS);
    return await fileToBase64(compressedFile);
  } catch (error) {
    console.error('Thumbnail creation failed:', error);
    throw new Error('Failed to create thumbnail');
  }
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
