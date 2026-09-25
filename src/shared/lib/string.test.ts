import { describe, expect, it, vi } from 'vitest';
import {
  camelCase,
  capitalize,
  capitalizeWords,
  charCount,
  escapeHtml,
  getInitials,
  hexToRgba,
  highlightSearch,
  isEmail,
  isUrl,
  maskEmail,
  maskPhone,
  pluralize,
  pluralizeVi,
  randomString,
  readingTime,
  removeAccents,
  searchVietnamese,
  slugify,
  snakeCase,
  stripHtml,
  truncate,
  truncateMiddle,
  uuid,
  wordCount,
} from './string';

describe('shared string helpers', () => {
  it('formats and capitalizes words without changing short values', () => {
    expect(truncate('hello', 5)).toBe('hello');
    expect(truncate('hello world', 5)).toBe('hello...');
    expect(truncateMiddle('0x1234567890', 8)).toBe('0x1...90');
    expect(truncateMiddle('short', 8)).toBe('short');
    expect(capitalize('hello')).toBe('Hello');
    expect(capitalize('')).toBe('');
    expect(capitalizeWords('tiếng việt')).toBe('Tiếng Việt');
    expect(slugify('  Tiếng Việt & Crypto!  ')).toBe('tieng-viet-crypto');
    expect(slugify('Đăng nhập')).toBe('dang-nhap');
    expect(camelCase('hello-world again')).toBe('helloWorldAgain');
    expect(snakeCase('helloWorld')).toBe('hello_world');
    expect(getInitials('trader one two')).toBe('TO');
    expect(getInitials('trader one two', 3)).toBe('TOT');
  });

  it('pluralizes, strips markup and escapes every HTML special character', () => {
    expect(pluralize(1, 'coin')).toBe('1 coin');
    expect(pluralize(2, 'coin')).toBe('2 coins');
    expect(pluralize(0, 'person', 'people')).toBe('0 people');
    expect(pluralizeVi(3, 'mặt hàng')).toBe('3 mặt hàng');
    expect(stripHtml('<p>BTC <strong>spot</strong></p>')).toBe('BTC spot');
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#039;');
  });

  it('validates and masks common contact values', () => {
    expect(isEmail('user@example.com')).toBe(true);
    expect(isEmail('not-an-email')).toBe(false);
    expect(isUrl('https://example.com')).toBe(true);
    expect(isUrl('not a URL')).toBe(false);
    expect(maskEmail('john@example.com')).toBe('joh***@example.com');
    expect(maskEmail('invalid')).toBe('invalid');
    expect(maskPhone('0123456789')).toBe('012***6789');
    expect(maskPhone('123456')).toBe('123456');
  });

  it('creates deterministic random identifiers and accent-insensitive search text', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    expect(randomString(8)).toMatch(/^[A-Za-z0-9]{8}$/);
    expect(uuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(removeAccents('Tiếng Việt')).toBe('Tieng Viet');
    expect(searchVietnamese('Giao dịch tiền mã hóa', 'tien ma hoa')).toBe(true);
    expect(searchVietnamese('Bitcoin', 'ethereum')).toBe(false);
  });

  it('highlights matches and estimates text size and reading time', () => {
    expect(highlightSearch('BTC btc', 'btc')).toBe('<mark>BTC</mark> <mark>btc</mark>');
    expect(highlightSearch('BTC. ETH', 'BTC.')).toBe('<mark>BTC.</mark> ETH');
    expect(highlightSearch('BTC', '  ')).toBe('BTC');
    expect(wordCount('  one\n two   three ')).toBe(3);
    expect(wordCount('  \n  ')).toBe(0);
    expect(charCount('a b\nc')).toBe(3);
    expect(readingTime('one two three', 2)).toBe(2);
    expect(readingTime('   ')).toBe(0);
  });

  it('converts six-digit hex colors to CSS rgba', () => {
    expect(hexToRgba('#3B82F6', 12)).toBe('rgba(59, 130, 246, 0.12)');
    expect(hexToRgba('000000', 100)).toBe('rgba(0, 0, 0, 1)');
  });
});
