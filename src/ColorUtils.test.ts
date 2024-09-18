import { describe, test, expect } from 'vitest';
import { test as fctest, fc } from '@fast-check/vitest';
import { hexToRgb, rgbToCIELab, deltaE94 } from './ColorUtils';
import { CIELABTuple, RGBTuple } from '@/lib/emojis/EmojiTypes';
import { toFixedNumber } from './lib/utils';

describe('hexToRgb', () => {
  test.each([
    {
      hex: '#000000',
      expectedRGB: [0, 0, 0] as RGBTuple,
    },
    {
      hex: '#FFFFFF',
      expectedRGB: [255, 255, 255] as RGBTuple,
    },
    {
      hex: '#FF0000',
      expectedRGB: [255, 0, 0] as RGBTuple,
    },
    {
      hex: '#333333',
      expectedRGB: [51, 51, 51] as RGBTuple,
    },
    {
      hex: '#18FF0C',
      expectedRGB: [24, 255, 12] as RGBTuple,
    },
    {
      hex: '#FFFF00',
      expectedRGB: [255, 255, 0] as RGBTuple,
    },
    {
      hex: '#D79B2A',
      expectedRGB: [215, 155, 42] as RGBTuple,
    },
    {
      hex: '#0FAFFF',
      expectedRGB: [15, 175, 255] as RGBTuple,
    },
  ])(
    'should return rgb($expectedRGB) for hex $hex',
    ({ hex, expectedRGB }: { hex: string; expectedRGB: RGBTuple }) => {
      const result = hexToRgb(hex);

      expect(result).toStrictEqual(expectedRGB);
    },
  );
});

describe('rgbToCIELab', () => {
  test.each([
    {
      rgb: [0, 0, 0] as RGBTuple,
      expectedCIELAB: [0, 0, 0] as CIELABTuple,
    },
    {
      rgb: [255, 255, 255] as RGBTuple,
      expectedCIELAB: [100, 0.01, -0.01] as CIELABTuple,
    },
    {
      rgb: [255, 0, 0] as RGBTuple,
      expectedCIELAB: [53.23, 80.11, 67.22] as CIELABTuple,
    },
    {
      rgb: [51, 51, 51] as RGBTuple,
      expectedCIELAB: [21.25, 0.0, -0.0] as CIELABTuple,
    },
    {
      rgb: [24, 255, 12] as RGBTuple,
      expectedCIELAB: [87.84, -85.16, 82.39] as CIELABTuple,
    },
    {
      rgb: [255, 255, 0] as RGBTuple,
      expectedCIELAB: [97.14, -21.56, 94.48] as CIELABTuple,
    },
    {
      rgb: [215, 155, 42] as RGBTuple,
      expectedCIELAB: [68.06, 12.87, 63.25] as CIELABTuple,
    },
    {
      rgb: [15, 175, 255] as RGBTuple,
      expectedCIELAB: [68.01, -8.64, -49.68] as CIELABTuple,
    },
  ])(
    'should return lab($expectedCIELAB) for rgb($rgb)',
    ({
      rgb,
      expectedCIELAB,
    }: {
      rgb: RGBTuple;
      expectedCIELAB: CIELABTuple;
    }) => {
      const result = rgbToCIELab(rgb[0], rgb[1], rgb[2]);

      expect(result.map((num) => toFixedNumber(num, 2, 10))).toStrictEqual(
        expectedCIELAB.map((num) => toFixedNumber(num, 2, 10)),
      );
    },
  );
});

describe('deltaE94', () => {
  fctest.prop([
    fc.tuple(
      fc.double({ min: 0.0, max: 100.0, noNaN: true }),
      fc.double({ min: -128, max: 127, noNaN: true }),
      fc.double({ min: -128, max: 127, noNaN: true }),
    ),
  ])('should return delta of `0` when passed identical Lab tuples', (lab) => {
    return deltaE94(lab, lab) === 0;
  });

  test.each([
    {
      labA: [3, 43, 53] as CIELABTuple,
      labB: [34, 53, 100] as CIELABTuple,
      expectedResults: 32.91,
    },
    {
      labA: [3, 43, 53] as CIELABTuple,
      labB: [7, 43, 53] as CIELABTuple,
      expectedResults: 4,
    },
    {
      labA: [94, 43, -12] as CIELABTuple,
      labB: [34, 53, 100] as CIELABTuple,
      expectedResults: 64.18,
    },
    {
      labA: [0, -124, 124] as CIELABTuple,
      labB: [4, 54, -100] as CIELABTuple,
      expectedResults: 77.37,
    },
    {
      labA: [47, -82, 124] as CIELABTuple,
      labB: [42, 54, 2] as CIELABTuple,
      expectedResults: 50.18,
    },
    {
      labA: [47, -82, 124] as CIELABTuple,
      labB: [47, -84, 120] as CIELABTuple,
      expectedResults: 1.24,
    },
  ])(
    'should return $expectedResults for Delta E94 of lab($labA) <-> labB($labB)',
    ({
      labA,
      labB,
      expectedResults,
    }: {
      labA: CIELABTuple;
      labB: CIELABTuple;
      expectedResults: number;
    }) => {
      const result = deltaE94(labA, labB);

      expect(toFixedNumber(result, 2, 10)).toBe(
        toFixedNumber(expectedResults, 2, 10),
      );
    },
  );
});
