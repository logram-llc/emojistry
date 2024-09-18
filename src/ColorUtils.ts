// Credit goes to node-vibrant for the majority of this code (https://github.com/Vibrant-Colors/node-vibrant/blob/8843d0094834d4685d1bff3abd77c6dd2daff82c/src/util.ts)
import { CIELABTuple, RGBTuple } from '@/lib/emojis/EmojiTypes';

type XYZTuple = [number, number, number];

export function hexToRgb(hex: string): RGBTuple | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

  return m === null
    ? null
    : <RGBTuple>[m[1], m[2], m[3]].map((s) => parseInt(s, 16));
}

function rgbToXyz(r: number, g: number, b: number): XYZTuple {
  r /= 255;
  g /= 255;
  b /= 255;
  r = r > 0.04045 ? Math.pow((r + 0.055) / 1.055, 2.4) : r / 12.92;
  g = g > 0.04045 ? Math.pow((g + 0.055) / 1.055, 2.4) : g / 12.92;
  b = b > 0.04045 ? Math.pow((b + 0.055) / 1.055, 2.4) : b / 12.92;

  r *= 100;
  g *= 100;
  b *= 100;

  const x = r * 0.4124 + g * 0.3576 + b * 0.1805;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = r * 0.0193 + g * 0.1192 + b * 0.9505;

  return [x, y, z];
}

function xyzToCIELab(x: number, y: number, z: number): CIELABTuple {
  // NOTE(nicholas-ramsey): REF_X, REF_Y, and REF_Z refer to CIE Tristimulus Values (XYZ), which are calculated based on the type of illumination and reflectance.
  // In this case, we're using D65 (Daylight, sRGB, Adobe-RGB).
  const REF_X = 95.047;
  const REF_Y = 100;
  const REF_Z = 108.883;

  x /= REF_X;
  y /= REF_Y;
  z /= REF_Z;

  x = x > 0.008856 ? Math.pow(x, 1 / 3) : 7.787 * x + 16 / 116;
  y = y > 0.008856 ? Math.pow(y, 1 / 3) : 7.787 * y + 16 / 116;
  z = z > 0.008856 ? Math.pow(z, 1 / 3) : 7.787 * z + 16 / 116;

  const L = 116 * y - 16;
  const a = 500 * (x - y);
  const b = 200 * (y - z);

  return [L, a, b];
}

export function rgbToCIELab(r: number, g: number, b: number): CIELABTuple {
  const [x, y, z] = rgbToXyz(r, g, b);
  return xyzToCIELab(x, y, z);
}

export function deltaE94(labA: CIELABTuple, labB: CIELABTuple): number {
  const WEIGHT_L = 1;
  const WEIGHT_C = 1;
  const WEIGHT_H = 1;

  const [L1, a1, b1] = labA;
  const [L2, a2, b2] = labB;
  const dL = L1 - L2;
  const da = a1 - a2;
  const db = b1 - b2;

  const xC1 = Math.sqrt(a1 * a1 + b1 * b1);
  const xC2 = Math.sqrt(a2 * a2 + b2 * b2);

  let xDL = L2 - L1;
  let xDC = xC2 - xC1;
  const xDE = Math.sqrt(dL * dL + da * da + db * db);

  let xDH =
    Math.sqrt(xDE) > Math.sqrt(Math.abs(xDL)) + Math.sqrt(Math.abs(xDC))
      ? Math.sqrt(xDE * xDE - xDL * xDL - xDC * xDC)
      : 0;

  const xSC = 1 + 0.045 * xC1;
  const xSH = 1 + 0.015 * xC1;

  xDL /= WEIGHT_L;
  xDC /= WEIGHT_C * xSC;
  xDH /= WEIGHT_H * xSH;

  return Math.sqrt(xDL * xDL + xDC * xDC + xDH * xDH);
}
