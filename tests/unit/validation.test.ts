import { validateEmail, validatePrice, validateQuantity, validatePassword } from '@/lib/utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('test.user@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe(false);
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('user@')).toBe(false);
    });
  });

  describe('validatePrice', () => {
    it('should accept valid prices', () => {
      expect(validatePrice(100)).toBe(true);
      expect(validatePrice(0.01)).toBe(true);
      expect(validatePrice(50000.5)).toBe(true);
    });

    it('should reject invalid prices', () => {
      expect(validatePrice(0)).toBe(false);
      expect(validatePrice(-10)).toBe(false);
      expect(validatePrice(NaN)).toBe(false);
    });
  });

  describe('validateQuantity', () => {
    it('should accept valid quantities', () => {
      expect(validateQuantity(1)).toBe(true);
      expect(validateQuantity(0.00000001)).toBe(true);
      expect(validateQuantity(100)).toBe(true);
    });

    it('should reject invalid quantities', () => {
      expect(validateQuantity(0)).toBe(false);
      expect(validateQuantity(-1)).toBe(false);
      expect(validateQuantity(NaN)).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('Password123').valid).toBe(true);
      expect(validatePassword('MyP@ssw0rd').valid).toBe(true);
      expect(validatePassword('SecurePass1').valid).toBe(true);
    });

    it('should reject short passwords', () => {
      const result = validatePassword('Pass1');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('8位');
    });

    it('should reject passwords without letters', () => {
      const result = validatePassword('12345678');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('字母和数字');
    });

    it('should reject passwords without numbers', () => {
      const result = validatePassword('Password');
      expect(result.valid).toBe(false);
      expect(result.message).toContain('字母和数字');
    });
  });
});

