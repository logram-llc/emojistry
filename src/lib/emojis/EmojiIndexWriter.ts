import { writeFile } from 'fs/promises';
import { join } from 'path';
import { EmojiFamily } from './EmojiTypes';
import { EmojiIndexer } from '@/lib/search/EmojiIndexer';
import { getFamilySearchIndexFile } from './utils';

export class EmojiIndexWriter {
  async write(
    family: EmojiFamily,
    indexOutputPath: string,
    indexer: EmojiIndexer,
  ): Promise<void> {
    const index = await indexer.export();

    await writeFile(
      join(indexOutputPath, getFamilySearchIndexFile(family)),
      JSON.stringify(index),
    );
  }
}
