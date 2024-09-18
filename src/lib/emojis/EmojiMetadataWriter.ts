import { writeFile } from 'fs/promises';
import { join } from 'path';
import { IEmoji, EmojiFamily } from './EmojiTypes';
import { getFamilyMetadataFile } from './utils';

export class EmojiMetadataWriter {
  async write(
    family: EmojiFamily,
    metadataOutputPath: string,
    metadata: Record<string, IEmoji>,
  ): Promise<void> {
    await writeFile(
      join(metadataOutputPath, getFamilyMetadataFile(family)),
      JSON.stringify(metadata),
    );
  }
}
