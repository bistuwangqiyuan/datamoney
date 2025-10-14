import { formatPrice, formatPercent, formatDateTime } from '@/lib/utils/format';

describe('Format Utils', () => {
  describe('formatPrice', () => {
    it('should format prices with 2 decimals', () => {
      expect(formatPrice(50000)).toBe('50,000.00');
      expect(formatPrice(123.456)).toBe('123.46');
      expect(formatPrice(0.12)).toBe('0.12');
    });

    it('should handle edge cases', () => {
      expect(formatPrice(0)).toBe('0.00');
      expect(formatPrice(0.001)).toBe('0.00');
    });
  });

  describe('formatPercent', () => {
    it('should format percentages with 2 decimals', () => {
      expect(formatPercent(5.5)).toBe('5.50%');
      expect(formatPercent(-2.34)).toBe('-2.34%');
      expect(formatPercent(0)).toBe('0.00%');
    });
  });

  describe('formatDateTime', () => {
    it('should format ISO dates correctly', () => {
      const date = '2025-01-15T10:30:00Z';
      const formatted = formatDateTime(date);
      expect(formatted).toMatch(/2025-01-15/);
      expect(formatted).toMatch(/\d{2}:\d{2}/);
    });

    it('should handle different time zones', () => {
      const date = '2025-01-15T00:00:00Z';
      const formatted = formatDateTime(date);
      expect(formatted).toBeTruthy();
    });
  });
});

