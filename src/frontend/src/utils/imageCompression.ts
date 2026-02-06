/**
 * Client-side image compression utility to reduce image file sizes
 * before uploading to the backend canister.
 */

const MAX_SIZE_BYTES = 2_000_000; // ~2MB target (below canister limit)
const MAX_DIMENSION = 1920; // Max width/height
const INITIAL_QUALITY = 0.85;
const MIN_QUALITY = 0.5;
const QUALITY_STEP = 0.05;

export interface CompressedImage {
  bytes: Uint8Array;
  contentType: string;
}

/**
 * Compress an image file to meet size constraints.
 * Automatically downscales and adjusts quality as needed.
 * 
 * @param file - The image file to compress
 * @returns Compressed image bytes and content type
 * @throws Error if compression fails or image cannot be reduced enough
 */
export async function compressImage(file: File): Promise<CompressedImage> {
  // If already small enough, return as-is
  if (file.size <= MAX_SIZE_BYTES) {
    const arrayBuffer = await file.arrayBuffer();
    return {
      bytes: new Uint8Array(arrayBuffer),
      contentType: file.type,
    };
  }

  // Load image
  const img = await loadImage(file);
  
  // Calculate scaled dimensions
  const { width, height } = calculateScaledDimensions(img.width, img.height);
  
  // Try compression with different quality levels
  let quality = INITIAL_QUALITY;
  let result: CompressedImage | null = null;
  
  while (quality >= MIN_QUALITY) {
    const compressed = await compressToCanvas(img, width, height, quality);
    
    if (compressed.bytes.length <= MAX_SIZE_BYTES) {
      result = compressed;
      break;
    }
    
    quality -= QUALITY_STEP;
  }
  
  if (!result) {
    throw new Error(
      `Unable to compress image below ${(MAX_SIZE_BYTES / 1024 / 1024).toFixed(1)}MB. ` +
      `Original size: ${(file.size / 1024 / 1024).toFixed(1)}MB. ` +
      `Try using a smaller image or lower resolution photo.`
    );
  }
  
  return result;
}

/**
 * Load an image file into an HTMLImageElement
 */
function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };
    
    img.src = url;
  });
}

/**
 * Calculate scaled dimensions while maintaining aspect ratio
 */
function calculateScaledDimensions(
  originalWidth: number,
  originalHeight: number
): { width: number; height: number } {
  if (originalWidth <= MAX_DIMENSION && originalHeight <= MAX_DIMENSION) {
    return { width: originalWidth, height: originalHeight };
  }
  
  const aspectRatio = originalWidth / originalHeight;
  
  if (originalWidth > originalHeight) {
    return {
      width: MAX_DIMENSION,
      height: Math.round(MAX_DIMENSION / aspectRatio),
    };
  } else {
    return {
      width: Math.round(MAX_DIMENSION * aspectRatio),
      height: MAX_DIMENSION,
    };
  }
}

/**
 * Compress image using canvas and return bytes
 */
function compressToCanvas(
  img: HTMLImageElement,
  width: number,
  height: number,
  quality: number
): Promise<CompressedImage> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }
    
    // Draw scaled image
    ctx.drawImage(img, 0, 0, width, height);
    
    // Convert to blob
    canvas.toBlob(
      async (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob from canvas'));
          return;
        }
        
        const arrayBuffer = await blob.arrayBuffer();
        resolve({
          bytes: new Uint8Array(arrayBuffer),
          contentType: 'image/jpeg',
        });
      },
      'image/jpeg',
      quality
    );
  });
}
