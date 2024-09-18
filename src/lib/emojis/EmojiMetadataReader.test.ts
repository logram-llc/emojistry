import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EmojiMetadataReader } from '@/lib/emojis/EmojiMetadataReader';
import { IEmoji, EmojiFamily } from '@/lib/emojis/EmojiTypes';
import { getFamilyMetadataFile } from '@/lib/emojis/utils';

const METADATA_FIXTURES: Record<string, IEmoji> = {
  smile: {
    id: 'emoji1',
    cldr: 'grinning face',
    group: 'Smileys & Emotion',
    keywords: ['face', 'smile', 'happy'],
    tts: 'grinning face',
    family: 'default',
    familyVersion: '1.0',
    glyph: '😀',
    styles: {},
    defaultStyle: 'default',
  },
  sad_face: {
    id: 'emoji2',
    cldr: 'sad face',
    group: 'Smileys & Emotion',
    keywords: ['face', 'sad', 'unhappy'],
    tts: 'sad face',
    family: 'default',
    familyVersion: '1.0',
    glyph: '😢',
    styles: {},
    defaultStyle: 'default',
  },
};

describe('EmojiMetadataReader', () => {
  let emojiMetadataReader: EmojiMetadataReader;
  let mockImportGlob: (
    pattern: string,
  ) => Record<string, () => Promise<{ default: Record<string, IEmoji> }>>;

  beforeEach(() => {
    mockImportGlob = vi.fn(() => ({
      [`../../Artifacts/${getFamilyMetadataFile(EmojiFamily.FLUENT_UI)}`]: () =>
        Promise.resolve({ default: METADATA_FIXTURES }),
      [`../../Artifacts/${getFamilyMetadataFile(EmojiFamily.NOTO)}`]: () =>
        Promise.resolve({ default: METADATA_FIXTURES }),
    }));

    emojiMetadataReader = new EmojiMetadataReader(mockImportGlob);
  });

  it('should load and cache metadata when calling all()', async () => {
    const result = await emojiMetadataReader.all(EmojiFamily.FLUENT_UI);

    expect(result).toStrictEqual(METADATA_FIXTURES);

    const cachedResult = await emojiMetadataReader.all(EmojiFamily.FLUENT_UI);

    expect(cachedResult).toStrictEqual(METADATA_FIXTURES);
    expect(mockImportGlob).toHaveBeenCalledTimes(1);
  });

  it('should return an emoji when calling get()', async () => {
    const result = await emojiMetadataReader.get(
      EmojiFamily.FLUENT_UI,
      'smile',
    );

    expect(result).toStrictEqual(METADATA_FIXTURES.smile);
  });

  it('should return undefined for a non-existent emoji in get()', async () => {
    const result = await emojiMetadataReader.get(
      EmojiFamily.FLUENT_UI,
      'non_existent_emoji',
    );

    expect(result).toBeUndefined();
  });
});
