import { describe, it, expect, vi } from 'vitest';
import { EmojiIndexReader } from '@/lib/emojis/EmojiIndexReader';
import { EmojiFamily } from '@/lib/emojis/EmojiTypes';
import { getFamilySearchIndexFile } from '@/lib/emojis/utils';

const INDEX_FIXTURES: Record<string, unknown> = {
  reg: { unimportantTestData: 5 },
};

describe('EmojiIndexReader', () => {
  it('should load and cache indexes when calling read()', async () => {
    const mockImportGlob = vi.fn(() => ({
      [`../../Artifacts/${getFamilySearchIndexFile(EmojiFamily.FLUENT_UI)}`]:
        () => Promise.resolve({ default: INDEX_FIXTURES }),
      [`../../Artifacts/${getFamilySearchIndexFile(EmojiFamily.NOTO)}`]: () =>
        Promise.resolve({ default: INDEX_FIXTURES }),
    }));
    const emojiIndexReader = new EmojiIndexReader(mockImportGlob);

    const result = await emojiIndexReader.read(EmojiFamily.NOTO);

    expect(result).toStrictEqual(INDEX_FIXTURES);

    const cachedResult = await emojiIndexReader.read(EmojiFamily.NOTO);

    expect(cachedResult).toStrictEqual(INDEX_FIXTURES);
    expect(mockImportGlob).toHaveBeenCalledTimes(1);
  });
});
