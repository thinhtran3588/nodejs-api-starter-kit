import { decode } from 'html-entities';
import sanitizeHtml from 'sanitize-html';

/**
 * Sanitization options for different use cases
 */
export interface SanitizeOptions {
  textOnly?: boolean;
}

/**
 * Sanitizes HTML content by removing dangerous tags and attributes
 * @param input - The string to sanitize
 * @returns Sanitized string with HTML tags removed
 */
export function sanitize<T extends string | undefined | null>(
  input: T,
  { textOnly = false }: SanitizeOptions = {}
): T {
  // eslint-disable-next-line no-null/no-null
  if (input === undefined || input === null) {
    return input;
  }

  // First trim whitespace
  const trimmed = input.trim();

  // Sanitize HTML and return the plain text content
  const sanitized = sanitizeHtml(trimmed);

  if (textOnly) {
    // decode from html-entities always returns a string
    return String(decode(sanitized)).trim() as T;
  }

  return sanitized as T;
}
