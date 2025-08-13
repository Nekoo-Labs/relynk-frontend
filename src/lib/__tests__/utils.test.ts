import { normalizeNumberForParseUnits } from '../utils';

describe('normalizeNumberForParseUnits', () => {
  test('handles scientific notation correctly', () => {
    expect(normalizeNumberForParseUnits('1e-10')).toBe('0.0000000001');
    expect(normalizeNumberForParseUnits('1.5e-6')).toBe('0.0000015');
    expect(normalizeNumberForParseUnits('1e+6')).toBe('1000000');
    expect(normalizeNumberForParseUnits('2.5e+3')).toBe('2500');
  });

  test('handles regular decimal numbers', () => {
    expect(normalizeNumberForParseUnits('1.5')).toBe('1.5');
    expect(normalizeNumberForParseUnits('100')).toBe('100');
    expect(normalizeNumberForParseUnits('0.001')).toBe('0.001');
  });

  test('handles edge cases', () => {
    expect(normalizeNumberForParseUnits('0')).toBe('0');
    expect(normalizeNumberForParseUnits('')).toBe('0');
    expect(normalizeNumberForParseUnits('   ')).toBe('0');
  });

  test('removes trailing zeros', () => {
    expect(normalizeNumberForParseUnits('1.50000')).toBe('1.5');
    expect(normalizeNumberForParseUnits('100.000')).toBe('100');
  });

  test('throws error for invalid inputs', () => {
    expect(() => normalizeNumberForParseUnits('invalid')).toThrow('Invalid number format');
    expect(() => normalizeNumberForParseUnits('-1')).toThrow('Invalid number format');
    expect(() => normalizeNumberForParseUnits('NaN')).toThrow('Invalid number format');
  });
});
