/**
 * Extract error message from API response
 * Handles various error response formats
 */
export async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const data = await response.json();
    
    // Check for common error field names
    if (data.error) return String(data.error);
    if (data.message) return String(data.message);
    if (data.err) return String(data.err);
    
    // If it's an object, try to find any string value
    if (typeof data === 'object' && data !== null) {
      const firstValue = Object.values(data).find(v => typeof v === 'string');
      if (firstValue) return String(firstValue);
    }
  } catch {
    // Response might not be JSON
  }

  // Fallback to status text
  return response.statusText || `Error ${response.status}`;
}
