import { describe, test, expect } from 'vitest';
import {
  deltaE94SortComparator,
  cldrSortComparator,
  groupAlphabeticSortComparator,
} from './SortUtils';
import { IEmoji, IEmojiStyle } from '@/lib/emojis/EmojiTypes';
import { toFixedNumber } from '@/lib/utils';

const DEFAULT_STYLE: Omit<IEmojiStyle, 'colorPalette'> = {
  id: 'default',
  label: 'Default Emoji Style',
  url: '/emoji.png',
  group: 'Standard',
  isSvg: false,
  height: 32,
  width: 32,
  x: 0,
  y: 0,
};

const EMOJI_STYLE_FIXTURES: IEmojiStyle[] = [
  {
    ...DEFAULT_STYLE,
    colorPalette: [
      {
        hex: '#000000',
        rgb: [0, 0, 0],
        hsl: [0, 0, 0],
        CIELAB: [0, 0, 0],
        occurrences: 1,
      },
    ],
  },
  {
    ...DEFAULT_STYLE,
    colorPalette: [
      {
        hex: '#FF0000',
        rgb: [255, 0, 0],
        hsl: [0, 100, 50],
        CIELAB: [53.23, 80.1, 67.22],
        occurrences: 1,
      },
    ],
  },
  {
    ...DEFAULT_STYLE,
    colorPalette: [
      {
        hex: '#0000FF',
        rgb: [0, 0, 255],
        hsl: [240, 100, 50],
        CIELAB: [32.3, 79.19, -107.86],
        occurrences: 1,
      },
    ],
  },
];

const EMOJI_FIXTURES: IEmoji[] = [
  {
    id: 'emoji1',
    cldr: 'grinning face',
    group: 'Smileys & Emotion',
    keywords: ['face', 'smile', 'happy'],
    tts: 'grinning face',
    family: 'default',
    familyVersion: '1.0',
    glyph: '😀',
    styles: {
      default: EMOJI_STYLE_FIXTURES[0],
    },
    defaultStyle: 'default',
  },
  {
    id: 'emoji2',
    cldr: 'sad face',
    group: 'Smileys & Emotion',
    keywords: ['face', 'sad', 'unhappy'],
    tts: 'sad face',
    family: 'default',
    familyVersion: '1.0',
    glyph: '😢',
    styles: {
      default: EMOJI_STYLE_FIXTURES[1],
    },
    defaultStyle: 'default',
  },
  {
    id: 'emoji3',
    cldr: 'apple',
    group: 'Food & Drink',
    keywords: ['fruit', 'apple'],
    tts: 'apple',
    family: 'default',
    familyVersion: '1.0',
    glyph: '🍎',
    styles: {
      default: EMOJI_STYLE_FIXTURES[2],
    },
    defaultStyle: 'default',
  },
  {
    id: 'emoji4',
    cldr: 'shuffle_tracks',
    group: 'Symbols',
    keywords: ['fruit', 'apple'],
    tts: 'shuffle tracks',
    family: 'default',
    familyVersion: '1.0',
    glyph: '🔀',
    styles: {
      default: EMOJI_STYLE_FIXTURES[2],
    },
    defaultStyle: 'default',
  },
];

describe('deltaE94SortComparator', () => {
  test.each([
    {
      emojiA: EMOJI_FIXTURES[0],
      emojiB: EMOJI_FIXTURES[0],
      expectedResults: 0,
    },
    {
      emojiA: EMOJI_FIXTURES[1],
      emojiB: EMOJI_FIXTURES[1],
      expectedResults: 0,
    },
    {
      emojiA: EMOJI_FIXTURES[1],
      emojiB: EMOJI_FIXTURES[0],
      expectedResults: 117.34,
    },
    {
      emojiA: EMOJI_FIXTURES[2],
      emojiB: EMOJI_FIXTURES[1],
      expectedResults: 20.32,
    },
    {
      emojiA: EMOJI_FIXTURES[0],
      emojiB: EMOJI_FIXTURES[2],
      expectedResults: -137.65,
    },
  ])(
    'should return $expectedResults for $emojiA.id <-> $emojiB.id',
    ({
      emojiA,
      emojiB,
      expectedResults,
    }: {
      emojiA: IEmoji;
      emojiB: IEmoji;
      expectedResults: number;
    }) => {
      const result = deltaE94SortComparator(emojiA, emojiB);

      expect(toFixedNumber(result, 2, 10)).toBe(expectedResults);
    },
  );
});

describe('groupAlphabeticSortComparator', () => {
  test.each([
    {
      emojiA: EMOJI_FIXTURES[0],
      emojiB: EMOJI_FIXTURES[0],
      expectedResults: 0,
    },
    {
      emojiA: EMOJI_FIXTURES[1],
      emojiB: EMOJI_FIXTURES[1],
      expectedResults: 0,
    },
    {
      emojiA: EMOJI_FIXTURES[1],
      emojiB: EMOJI_FIXTURES[0],
      expectedResults: 0,
    },
    {
      emojiA: EMOJI_FIXTURES[2],
      emojiB: EMOJI_FIXTURES[1],
      expectedResults: -1,
    },
    {
      emojiA: EMOJI_FIXTURES[0],
      emojiB: EMOJI_FIXTURES[2],
      expectedResults: 1,
    },
    {
      emojiA: EMOJI_FIXTURES[3],
      emojiB: EMOJI_FIXTURES[2],
      expectedResults: 1,
    },
    {
      emojiA: EMOJI_FIXTURES[3],
      emojiB: EMOJI_FIXTURES[1],
      expectedResults: 1,
    },
  ])(
    'should return $expectedResults for $emojiA.id <-> $emojiB.id',
    ({
      emojiA,
      emojiB,
      expectedResults,
    }: {
      emojiA: IEmoji;
      emojiB: IEmoji;
      expectedResults: number;
    }) => {
      const result = groupAlphabeticSortComparator(emojiA, emojiB);

      expect(result).toBe(expectedResults);
    },
  );
});

describe('cldrSortComparator', () => {
  test.each([
    {
      emojiA: EMOJI_FIXTURES[0],
      emojiB: EMOJI_FIXTURES[0],
      expectedResults: 0,
    },
    {
      emojiA: EMOJI_FIXTURES[1],
      emojiB: EMOJI_FIXTURES[1],
      expectedResults: 0,
    },
    {
      emojiA: EMOJI_FIXTURES[1],
      emojiB: EMOJI_FIXTURES[0],
      expectedResults: 1,
    },
    {
      emojiA: EMOJI_FIXTURES[2],
      emojiB: EMOJI_FIXTURES[1],
      expectedResults: -1,
    },
    {
      emojiA: EMOJI_FIXTURES[3],
      emojiB: EMOJI_FIXTURES[1],
      expectedResults: 1,
    },
    {
      emojiA: EMOJI_FIXTURES[3],
      emojiB: EMOJI_FIXTURES[2],
      expectedResults: 1,
    },
  ])(
    'should return $expectedResults for $emojiA.id <-> $emojiB.id',
    ({
      emojiA,
      emojiB,
      expectedResults,
    }: {
      emojiA: IEmoji;
      emojiB: IEmoji;
      expectedResults: number;
    }) => {
      const result = cldrSortComparator(emojiA, emojiB);

      expect(result).toBe(expectedResults);
    },
  );
});
