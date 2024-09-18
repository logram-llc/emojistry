import { EmojiIndexer } from '../src/lib/search/EmojiIndexer';
import { EmojiFamily } from '../src/lib/emojis/EmojiTypes';
import { EmojiMetadataReader } from '../src/lib/emojis/EmojiMetadataReader';
import { EmojiIndexWriter } from '../src/lib/emojis/EmojiIndexWriter';

export async function buildEmojisIndex(
  family: EmojiFamily,
): Promise<EmojiIndexer> {
  const index = new EmojiIndexer();
  const emojisMetadata = await new EmojiMetadataReader().all(family);

  for (const emojiMetadata of Object.values(emojisMetadata)) {
    index.addEmojiDocument({
      cldr: emojiMetadata.cldr,
      keywords: emojiMetadata.keywords,
      tts: emojiMetadata.tts,
      group: emojiMetadata.group,
    });
  }

  return index;
}

if (process.argv.length < 3) {
  throw new Error('Must pass a directory path to write the index to.');
}

const outputPath = process.argv[2];

const emojiIndexWriter = new EmojiIndexWriter();

(async () => {
  for (const familyName of Object.keys(EmojiFamily)) {
    console.log(`Building search index for family ${familyName}...`);

    const index = await buildEmojisIndex(EmojiFamily[familyName]);

    await emojiIndexWriter.write(EmojiFamily[familyName], outputPath, index);

    console.log(`Built search index for family ${familyName}`);
  }
})();
