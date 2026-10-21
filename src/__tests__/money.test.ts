import {
  formatAmountForInput,
  formatPeso,
  formatQuantity,
  parseMoneyInput,
  roundMoney,
  sanitizeMoneyInput,
} from '../utils/money';

describe('formatPeso', () => {
  it('shows centavos only when needed by default', () => {
    expect(formatPeso(1099)).toBe('₱1,099');
    expect(formatPeso(219.8)).toBe('₱219.80');
    expect(formatPeso(0)).toBe('₱0');
  });

  it('supports explicit cent modes', () => {
    expect(formatPeso(1099, { cents: 'always' })).toBe('₱1,099.00');
    expect(formatPeso(219.8, { cents: 'never' })).toBe('₱220');
    expect(formatPeso(-1234.5)).toBe('-₱1,234.50');
  });
});

describe('money input helpers', () => {
  it('keeps only a valid amount while typing', () => {
    expect(sanitizeMoneyInput('₱1,234.567')).toBe('1234.56');
    expect(sanitizeMoneyInput('12.3.4')).toBe('12.34');
    expect(sanitizeMoneyInput('abc')).toBe('');
    expect(sanitizeMoneyInput('00042')).toBe('42');
  });

  it('parses incomplete input as zero', () => {
    expect(parseMoneyInput('')).toBe(0);
    expect(parseMoneyInput('.')).toBe(0);
    expect(parseMoneyInput('12.345')).toBe(12.35);
  });

  it('formats values for editable fields', () => {
    expect(formatAmountForInput(1099)).toBe('1099');
    expect(formatAmountForInput(219.8)).toBe('219.80');
    expect(formatQuantity(2)).toBe('2');
    expect(formatQuantity(1.5)).toBe('1.5');
  });
});

describe('roundMoney', () => {
  it('rounds to two decimal places', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3);
    expect(roundMoney(10.005)).toBe(10.01);
  });
});
