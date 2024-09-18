import { describe, expect, test } from 'vitest';
import { UrlManager } from '@/lib/UrlManager';
import { EmojiFamily, IEmoji } from '@/lib/emojis/EmojiTypes';

const EMOJI_FIXTURES: IEmoji[] = [
  {
    id: 'emoji1',
    cldr: 'grinning face',
    group: 'Smileys & Emotion',
    keywords: ['face', 'smile', 'happy'],
    tts: 'grinning face',
    family: EmojiFamily.FLUENT_UI.toString(),
    familyVersion: '1.0',
    glyph: '😀',
    styles: {},
    defaultStyle: 'default',
  },
  {
    id: 'emoji2',
    cldr: 'sad face',
    group: 'Smileys & Emotion',
    keywords: ['face', 'sad', 'unhappy'],
    tts: 'sad face',
    family: EmojiFamily.FLUENT_UI.toString(),
    familyVersion: '1.0',
    glyph: '😢',
    styles: {},
    defaultStyle: 'default',
  },
  {
    id: 'emoji3',
    cldr: 'apple',
    group: 'Food & Drink',
    keywords: ['fruit', 'apple'],
    tts: 'apple',
    family: EmojiFamily.NOTO.toString(),
    familyVersion: '1.0',
    glyph: '🍎',
    styles: {},
    defaultStyle: 'default',
  },
];

describe('UrlManager', () => {
  describe('getFamilyPath', () => {
    test.each([
      {
        emojiFamily: EmojiFamily.FLUENT_UI,
        expectedPath: '/FLUENT_UI',
      },
      {
        emojiFamily: EmojiFamily.NOTO,
        expectedPath: '/NOTO',
      },
    ])(
      'should return $expectedPath for family $emojiFamily',
      ({ emojiFamily, expectedPath }) => {
        const path = UrlManager.getFamilyPath(emojiFamily.toString());

        expect(path).toBe(expectedPath);
      },
    );
  });

  describe('getEmojiPath', () => {
    test.each([
      {
        emoji: EMOJI_FIXTURES[0],
        expectedPath: '/FLUENT_UI/grinning%20face',
      },
      {
        emoji: EMOJI_FIXTURES[1],
        expectedPath: '/FLUENT_UI/sad%20face',
      },
      {
        emoji: EMOJI_FIXTURES[2],
        expectedPath: '/NOTO/apple',
      },
    ])(
      'should return the correct encoded emoji path',
      ({ emoji, expectedPath }) => {
        const path = UrlManager.getEmojiPath(emoji);

        expect(path).toBe(expectedPath);
      },
    );
  });
});
