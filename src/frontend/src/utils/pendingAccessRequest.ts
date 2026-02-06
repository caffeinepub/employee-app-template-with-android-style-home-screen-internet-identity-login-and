// Shared utility for managing pending access request state in localStorage

export interface PendingRequest {
  name: string;
  fourCharId: string;
  principal: string;
  timestamp: number;
}

const STORAGE_KEY = 'pending_access_request';

/**
 * Get the pending access request for the current principal
 */
export function getPendingRequest(principal: string): PendingRequest | null {
  const stored = localStorage.getItem(STORAGE_KEY);
  
  if (!stored) return null;
  
  try {
    const parsed: PendingRequest = JSON.parse(stored);
    // Only return if it's for the current principal
    if (parsed.principal === principal) {
      return parsed;
    }
    // Clear stale data for different principal
    clearPendingRequest();
    return null;
  } catch (e) {
    console.error('Failed to parse stored pending request:', e);
    clearPendingRequest();
    return null;
  }
}

/**
 * Save a pending access request to localStorage
 */
export function savePendingRequest(request: PendingRequest): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(request));
}

/**
 * Clear the pending access request from localStorage
 */
export function clearPendingRequest(): void {
  localStorage.removeItem(STORAGE_KEY);
}
