/**
 * ══════════════════════════════════════════════════════════
 *  STRING HELPER UTILITIES
 * ══════════════════════════════════════════════════════════
 *
 *  Common string manipulation functions.
 */

/**
 * Truncate string with ellipsis
 * @example truncate("Hello World", 8) // "Hello..."
 */
export function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

/**
 * Truncate in middle with ellipsis
 * @example truncateMiddle("0x1234567890abcdef", 10) // "0x1234...cdef"
 */
export function truncateMiddle(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  const charsToShow = maxLength - 3; // 3 for "..."
  const frontChars = Math.ceil(charsToShow / 2);
  const backChars = Math.floor(charsToShow / 2);
  return str.slice(0, frontChars) + '...' + str.slice(-backChars);
}

/**
 * Capitalize first letter
 * @example capitalize("hello world") // "Hello world"
 */
export function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Capitalize each word
 * @example capitalizeWords("hello world") // "Hello World"
 */
export function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Convert to kebab-case
 * @example slugify("Hello World!") // "hello-world"
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Convert to camelCase
 * @example camelCase("hello-world") // "helloWorld"
 */
export function camelCase(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

/**
 * Convert to snake_case
 * @example snakeCase("helloWorld") // "hello_world"
 */
export function snakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
}

/**
 * Pluralize word based on count
 * @example pluralize(1, "item") // "1 item"
 * @example pluralize(2, "item") // "2 items"
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const word = count === 1 ? singular : (plural || singular + 's');
  return `${count} ${word}`;
}

/**
 * Vietnamese pluralize (most words don't change)
 * @example pluralizeVi(1, "mặt hàng") // "1 mặt hàng"
 * @example pluralizeVi(5, "mặt hàng") // "5 mặt hàng"
 */
export function pluralizeVi(count: number, word: string): string {
  return `${count} ${word}`;
}

/**
 * Strip HTML tags
 * @example stripHtml("<p>Hello</p>") // "Hello"
 */
export function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML entities
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Check if string is email
 */
export function isEmail(str: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(str);
}

/**
 * Check if string is URL
 */
export function isUrl(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

/**
 * Mask email (show first 3 chars and domain)
 * @example maskEmail("john@example.com") // "joh***@example.com"
 */
export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;
  return `${local.slice(0, 3)}***@${domain}`;
}

/**
 * Mask phone number
 * @example maskPhone("0123456789") // "012***6789"
 */
export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  const start = phone.slice(0, 3);
  const end = phone.slice(-4);
  return `${start}***${end}`;
}

/**
 * Generate random string
 */
export function randomString(length: number): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Generate UUID v4
 */
export function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Remove accents from Vietnamese text
 * @example removeAccents("Tiếng Việt") // "Tieng Viet"
 */
export function removeAccents(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Search Vietnamese text (accent-insensitive)
 */
export function searchVietnamese(text: string, query: string): boolean {
  const normalizedText = removeAccents(text.toLowerCase());
  const normalizedQuery = removeAccents(query.toLowerCase());
  return normalizedText.includes(normalizedQuery);
}

/**
 * Highlight search matches
 */
export function highlightSearch(text: string, query: string): string {
  if (!query.trim()) return text;
  const regex = new RegExp(`(${query})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Extract initials from name
 * @example getInitials("John Doe") // "JD"
 */
export function getInitials(name: string, maxLength: number = 2): string {
  return name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, maxLength);
}

/**
 * Word count
 */
export function wordCount(str: string): number {
  return str.trim().split(/\s+/).length;
}

/**
 * Character count (excluding spaces)
 */
export function charCount(str: string): number {
  return str.replace(/\s/g, '').length;
}

/**
 * Reading time estimate (minutes)
 */
export function readingTime(str: string, wordsPerMinute: number = 200): number {
  const words = wordCount(str);
  return Math.ceil(words / wordsPerMinute);
}

/**
 * ══════════════════════════════════════════════════════════
 *  COLOR UTILITIES
 * ══════════════════════════════════════════════════════════
 */

/**
 * Convert hex color to rgba with opacity
 * @param hex - Hex color (e.g., "#3B82F6" or "3B82F6")
 * @param opacity - Opacity value 0-100 (e.g., 12 = 0.12, 50 = 0.50)
 * @returns Valid CSS rgba() string
 * @example hexToRgba("#3B82F6", 12) // "rgba(59, 130, 246, 0.12)"
 */
export function hexToRgba(hex: string, opacity: number): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Parse RGB values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);
  
  // Convert opacity from 0-100 to 0-1
  const alpha = opacity / 100;
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
