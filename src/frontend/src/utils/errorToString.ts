/**
 * Robust error-to-string formatter that extracts meaningful details
 * from unknown thrown values (Error instances, strings, objects).
 * 
 * Prefers rich fields when present (e.g., status/response/body/message),
 * and safely stringifies nested details without throwing.
 */

export function errorToString(error: unknown): string {
  // Handle null/undefined
  if (error == null) {
    return 'Unknown error occurred';
  }

  // Handle Error instances
  if (error instanceof Error) {
    // Check for HTTP-like error properties
    const errorAny = error as any;
    
    // Build detailed message
    const parts: string[] = [];
    
    // Add main message
    if (error.message) {
      parts.push(error.message);
    }
    
    // Add HTTP status if present
    if (errorAny.status !== undefined) {
      parts.push(`Status: ${errorAny.status}`);
    }
    
    // Add response body if present
    if (errorAny.body !== undefined) {
      try {
        const bodyStr = typeof errorAny.body === 'string' 
          ? errorAny.body 
          : JSON.stringify(errorAny.body, null, 2);
        parts.push(`Body: ${bodyStr}`);
      } catch {
        parts.push(`Body: [Unable to stringify]`);
      }
    }
    
    // Add response text if present
    if (errorAny.response !== undefined) {
      try {
        const responseStr = typeof errorAny.response === 'string'
          ? errorAny.response
          : JSON.stringify(errorAny.response, null, 2);
        parts.push(`Response: ${responseStr}`);
      } catch {
        parts.push(`Response: [Unable to stringify]`);
      }
    }
    
    // Add headers if present
    if (errorAny.headers !== undefined) {
      try {
        const headersStr = JSON.stringify(errorAny.headers, null, 2);
        parts.push(`Headers: ${headersStr}`);
      } catch {
        parts.push(`Headers: [Unable to stringify]`);
      }
    }
    
    return parts.length > 0 ? parts.join('\n\n') : 'Error occurred';
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Handle objects with message property
  if (typeof error === 'object') {
    const errorObj = error as any;
    
    // Try to extract meaningful fields
    const parts: string[] = [];
    
    if (errorObj.message) {
      parts.push(String(errorObj.message));
    }
    
    if (errorObj.status !== undefined) {
      parts.push(`Status: ${errorObj.status}`);
    }
    
    if (errorObj.body !== undefined) {
      try {
        const bodyStr = typeof errorObj.body === 'string'
          ? errorObj.body
          : JSON.stringify(errorObj.body, null, 2);
        parts.push(`Body: ${bodyStr}`);
      } catch {
        parts.push(`Body: [Unable to stringify]`);
      }
    }
    
    // If we got some parts, return them
    if (parts.length > 0) {
      return parts.join('\n\n');
    }
    
    // Otherwise try to stringify the whole object
    try {
      return JSON.stringify(error, null, 2);
    } catch {
      return String(error);
    }
  }

  // Fallback: convert to string
  return String(error);
}
