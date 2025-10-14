import { MIN_ORDER_QUANTITY_BTC, MAX_ORDER_QUANTITY_BTC, MIN_ORDER_VALUE_USDT } from './constants';

/**
 * 验证邮箱格式
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 */
export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 8) {
    return { valid: false, message: '密码至少需要 8 个字符' };
  }
  if (!/[a-zA-Z]/.test(password)) {
    return { valid: false, message: '密码必须包含字母' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: '密码必须包含数字' };
  }
  return { valid: true };
}

/**
 * 验证订单价格
 */
export function validatePrice(price: number): {
  valid: boolean;
  message?: string;
} {
  if (isNaN(price) || price <= 0) {
    return { valid: false, message: '价格必须大于 0' };
  }
  return { valid: true };
}

/**
 * 验证订单数量
 */
export function validateQuantity(quantity: number, side: 'BUY' | 'SELL'): {
  valid: boolean;
  message?: string;
} {
  if (isNaN(quantity) || quantity <= 0) {
    return { valid: false, message: '数量必须大于 0' };
  }
  if (quantity < MIN_ORDER_QUANTITY_BTC) {
    return {
      valid: false,
      message: `最小下单数量为 ${MIN_ORDER_QUANTITY_BTC} BTC`,
    };
  }
  if (quantity > MAX_ORDER_QUANTITY_BTC) {
    return {
      valid: false,
      message: `最大下单数量为 ${MAX_ORDER_QUANTITY_BTC} BTC`,
    };
  }
  return { valid: true };
}

/**
 * 验证订单总值
 */
export function validateOrderValue(price: number, quantity: number): {
  valid: boolean;
  message?: string;
} {
  const total = price * quantity;
  if (total < MIN_ORDER_VALUE_USDT) {
    return {
      valid: false,
      message: `最小下单金额为 ${MIN_ORDER_VALUE_USDT} USDT`,
    };
  }
  return { valid: true };
}

