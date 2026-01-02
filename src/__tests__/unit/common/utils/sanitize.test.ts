import { describe, expect, it } from 'vitest';
import { sanitize } from '@app/common/utils/sanitize';

describe('sanitize', () => {
  describe('happy path', () => {
    it('should return sanitized string with HTML tags removed', () => {
      const input = '<script>alert("xss")</script>Hello World';
      const result = sanitize(input);

      expect(result).toBe('Hello World');
    });

    it('should return original string when no HTML tags present', () => {
      const input = 'Hello World';
      const result = sanitize(input);

      expect(result).toBe('Hello World');
    });

    it('should remove dangerous HTML tags', () => {
      const input = '<script>malicious</script><p>Safe content</p>';
      const result = sanitize(input);

      expect(result).toBe('<p>Safe content</p>');
    });

    it('should preserve safe HTML when textOnly is false', () => {
      const input = '<p>Safe paragraph</p>';
      const result = sanitize(input, { textOnly: false });

      expect(result).toBe('<p>Safe paragraph</p>');
    });

    it('should return plain text when textOnly is true', () => {
      const input = 'Safe paragraph';
      const result = sanitize(input, { textOnly: true });

      expect(result).toBe('Safe paragraph');
    });

    it('should trim whitespace from input', () => {
      const input = '  Hello World  ';
      const result = sanitize(input);

      expect(result).toBe('Hello World');
    });

    it('should handle HTML entities when textOnly is true', () => {
      const input = '&amp; &lt; &gt; &quot;';
      const result = sanitize(input, { textOnly: true });

      expect(result).toBe('& < > "');
    });
  });

  describe('null and undefined handling', () => {
    it('should return undefined when input is undefined', () => {
      const result = sanitize(undefined);

      expect(result).toBeUndefined();
    });

    it('should return null when input is null', () => {
      const result = sanitize(null);

      expect(result).toBeNull();
    });

    it('should return undefined when input is undefined and textOnly is true', () => {
      const result = sanitize(undefined, { textOnly: true });

      expect(result).toBeUndefined();
    });

    it('should return null when input is null and textOnly is true', () => {
      const result = sanitize(null, { textOnly: true });

      expect(result).toBeNull();
    });
  });

  describe('XSS prevention', () => {
    it('should remove script tags', () => {
      const input = '<script>alert("xss")</script>Content';
      const result = sanitize(input);

      expect(result).toBe('Content');
    });

    it('should remove javascript: protocol', () => {
      const input = '<a href="javascript:alert(\'xss\')">Link</a>';
      const result = sanitize(input);

      expect(result).not.toContain('javascript:');
    });

    it('should remove event handlers', () => {
      const input = '<div onclick="alert(\'xss\')">Content</div>';
      const result = sanitize(input);

      expect(result).not.toContain('onclick');
    });

    it('should handle nested dangerous tags', () => {
      const input = '<div><script>alert("xss")</script><p>Safe</p></div>';
      const result = sanitize(input);

      expect(result).not.toContain('<script>');
      expect(result).toContain('Safe');
    });
  });

  describe('edge cases', () => {
    it('should handle empty string', () => {
      const result = sanitize('');

      expect(result).toBe('');
    });

    it('should handle whitespace-only string', () => {
      const result = sanitize('   ');

      expect(result).toBe('');
    });

    it('should handle string with only HTML tags', () => {
      const input = '<script></script><div></div>';
      const result = sanitize(input);

      expect(result).toBe('<div></div>');
    });

    it('should preserve line breaks in safe content', () => {
      const input = '<p>Line 1<br>Line 2</p>';
      const result = sanitize(input, { textOnly: false });

      expect(result).toContain('Line 1');
      expect(result).toContain('Line 2');
    });

    it('should handle complex HTML structure', () => {
      const input =
        '<div><h1>Title</h1><p>Paragraph with <strong>bold</strong> text</p></div>';
      const result = sanitize(input, { textOnly: true });

      expect(result).toContain('Title');
      expect(result).toContain('Paragraph');
      expect(result).toContain('bold');
      expect(result).toContain('text');
    });

    it('should handle special characters', () => {
      const input = '<p>Special: &copy; &reg; &trade;</p>';
      const result = sanitize(input, { textOnly: true });

      expect(result).toContain('Special');
    });
  });
});
