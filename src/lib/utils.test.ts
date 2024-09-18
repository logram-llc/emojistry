import { describe, expect, test } from 'vitest';
import { test as fctest, fc } from '@fast-check/vitest';
import { toFixedNumber } from '@/lib/utils';

describe('toFixedNumber', () => {
  test.each([
    {
      number: 1337.1337,
      digits: 3,
      expectedResults: 1337.134,
    },
    {
      number: 420.69,
      digits: 1,
      expectedResults: 420.7,
    },
    {
      number: 420.65,
      digits: 1,
      expectedResults: 420.7,
    },
    {
      number: 420.64,
      digits: 1,
      expectedResults: 420.6,
    },
    {
      number: 420.691,
      digits: 2,
      expectedResults: 420.69,
    },
    {
      number: 420.696,
      digits: 2,
      expectedResults: 420.7,
    },
  ])(
    'should round to nearest $digits for toFixedNumber($number, $digits, 10)',
    ({ number, digits, expectedResults }) => {
      expect(toFixedNumber(number, digits, 10)).toBe(expectedResults);
    },
  );

  fctest.prop([
    fc.double({ min: -1e20, max: 1e20, noNaN: true }),
    fc.nat({ max: 17 }),
  ])('should not return NaN', (number, digits) => {
    const result = toFixedNumber(number, digits, 10);

    expect(result).not.toBeNaN();
  });

  fctest.prop([
    fc.double({ min: -1e20, max: 1e20, noNaN: true }),
    fc.nat({ max: 17 }),
  ])('should truncate to set digits', (number, digits) => {
    const result = toFixedNumber(number, digits, 10);

    const resultStr = result.toString();
    const decimalIndex = resultStr.indexOf('.');
    const digitsAfterDecimal =
      decimalIndex >= 0 ? resultStr.length - decimalIndex - 1 : 0;

    expect(digitsAfterDecimal).toBeLessThanOrEqual(digits);
  });
});
