export type RGBTuple = [number, number, number];
export type HSLTuple = [number, number, number];
export type CIELABTuple = [number, number, number];

export interface ISwatch {
  hex: string;
  rgb: RGBTuple;
  hsl: HSLTuple;
  CIELAB: CIELABTuple;
  occurrences: number;
}

export interface IEmojiStyle {
  id: string;
  label: string;
  url: string;
  group: string;
  isSvg: boolean;
  colorPalette: ISwatch[];
  height: number | null;
  width: number | null;
  x: number | null;
  y: number | null;
}

export interface IEmoji {
  id: string;
  cldr: string;
  group: string;
  keywords: string[];
  tts: string;
  family: string;
  familyVersion: string;
  glyph: string;
  styles: Record<IEmojiStyle['id'], IEmojiStyle>;
  defaultStyle: IEmojiStyle['id'];
}

export interface IEmojiMetadataReader {
  get(family: EmojiFamily, cldr: string): Promise<IEmoji | undefined>;
  all(family: EmojiFamily): Promise<Record<string, IEmoji>>;
}

export enum EmojiFamily {
  // Microsoft's emoji library
  FLUENT_UI = 'FLUENT_UI',
  // Google's "No Tofu" emoji library
  NOTO = 'NOTO',
}

export const MISSING_EMOJI_GROUP = 'Others';

/**
 * Normalized emoji skintones
 */
export enum EmojiSkintone {
  DEFAULT = 'Default',
  LIGHT = 'Light',
  MEDIUM_LIGHT = 'Medium-Light',
  MEDIUM = 'Medium',
  MEDIUM_DARK = 'Medium-Dark',
  DARK = 'Dark',
}

export enum EmojiPersonCharacteristic {
  WOMAN = 'Woman',
  MAN = 'Man',
  BOY = 'Boy',
  GIRL = 'Girl',
}

export const ZERO_WIDTH_JOINER = 0x200d;

export const SKINTONES_BY_MODIFIER = {
  [0x1f3fb]: EmojiSkintone.LIGHT,
  [0x1f3fc]: EmojiSkintone.MEDIUM_LIGHT,
  [0x1f3fd]: EmojiSkintone.MEDIUM,
  [0x1f3fe]: EmojiSkintone.MEDIUM_DARK,
  [0x1f3ff]: EmojiSkintone.DARK,
} as const;

export const PERSON_CHARACTERISTIC_BY_MODIFIER = {
  [0x1f469]: EmojiPersonCharacteristic.WOMAN,
  [0x1f468]: EmojiPersonCharacteristic.MAN,
  [0x1f467]: EmojiPersonCharacteristic.GIRL,
  [0x1f466]: EmojiPersonCharacteristic.BOY,
} as const;
