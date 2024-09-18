import { describe, expect, test } from 'vitest';
import {
  normalizeFamilyName,
  getFamilyMetadataFile,
  getFamilySearchIndexFile,
} from '@/lib/emojis/utils';
import { EmojiFamily } from '@/lib/emojis/EmojiTypes';

describe('normalizeFamilyName', () => {
  test.each([
    {
      emojiFamily: EmojiFamily.FLUENT_UI,
      expectedResults: 'fluent_ui',
    },
    {
      emojiFamily: EmojiFamily.NOTO,
      expectedResults: 'noto',
    },
  ])(
    'should normalize emoji family $emojiFamily to $expectedResults',
    ({ emojiFamily, expectedResults }) => {
      expect(normalizeFamilyName(emojiFamily)).toBe(expectedResults);
    },
  );
});

describe('getFamilyMetadataFile', () => {
  test.each([
    {
      emojiFamily: EmojiFamily.FLUENT_UI,
      expectedFileName: 'fluent_ui-Metadata.json',
    },
    {
      emojiFamily: EmojiFamily.NOTO,
      expectedFileName: 'noto-Metadata.json',
    },
  ])(
    'should generate $expectedFileName for emoji family $emojiFamily',
    ({ emojiFamily, expectedFileName }) => {
      expect(getFamilyMetadataFile(emojiFamily)).toBe(expectedFileName);
    },
  );
});

describe('getFamilySearchIndexFile', () => {
  test.each([
    {
      emojiFamily: EmojiFamily.FLUENT_UI,
      expectedFileName: 'fluent_ui-SearchIndex.json',
    },
    {
      emojiFamily: EmojiFamily.NOTO,
      expectedFileName: 'noto-SearchIndex.json',
    },
  ])(
    'should generate $expectedFileName for emoji family $emojiFamily',
    ({ emojiFamily, expectedFileName }) => {
      expect(getFamilySearchIndexFile(emojiFamily)).toBe(expectedFileName);
    },
  );
});
