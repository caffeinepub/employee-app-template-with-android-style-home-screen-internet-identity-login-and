/**
 * Utility for converting custom module ImageData (bytes + contentType) 
 * into browser-renderable URLs using object URLs.
 * 
 * IMPORTANT: Always revoke object URLs when component unmounts or when
 * the URL is no longer needed to prevent memory leaks.
 * 
 * Example usage:
 * ```typescript
 * const imageUrl = createImageUrl(module.image);
 * // ... use imageUrl in <img src={imageUrl} />
 * // Clean up when done:
 * useEffect(() => {
 *   return () => {
 *     if (imageUrl) URL.revokeObjectURL(imageUrl);
 *   };
 * }, [imageUrl]);
 * ```
 */

import type { ImageData } from '../backend';

/**
 * Convert ImageData (bytes + contentType) to an object URL for rendering
 */
export function createImageUrl(imageData: ImageData): string {
  const blob = new Blob([new Uint8Array(imageData.bytes)], { type: imageData.contentType });
  return URL.createObjectURL(blob);
}

/**
 * Revoke an object URL to free memory
 */
export function revokeImageUrl(url: string): void {
  URL.revokeObjectURL(url);
}
