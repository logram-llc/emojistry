import { EmojiFamily } from './EmojiTypes';
import { getFamilySearchIndexFile } from './utils';

export class EmojiIndexReader {
  private allCache: Record<EmojiFamily, Record<string, unknown> | null> = {
    [EmojiFamily.FLUENT_UI]: null,
    [EmojiFamily.NOTO]: null,
  };

  constructor(
    private importGlob?: (
      pattern: string,
    ) => Record<string, () => Promise<{ default: Record<string, unknown> }>>,
  ) {}

  async read(family: EmojiFamily): Promise<Record<string, unknown>> {
    if (this.allCache[family] !== null) {
      return this.allCache[family];
    }

    const indexPaths = this.importGlob
      ? this.importGlob('../../Artifacts/*-SearchIndex.json')
      : import.meta.glob('../../Artifacts/*-SearchIndex.json');
    const foundIndexPath = Object.keys(indexPaths).filter((indexPath) =>
      indexPath.endsWith(getFamilySearchIndexFile(family)),
    )[0];
    const { default: emojiIndex } = await indexPaths[foundIndexPath]();

    this.allCache[family] = emojiIndex;

    return emojiIndex;
  }
}
