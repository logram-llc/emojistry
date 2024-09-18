import { IEmoji, EmojiFamily } from './EmojiTypes';
import { getFamilyMetadataFile } from './utils';

// TODO(nicholas-ramsey): Move this and use it where needed. Really need to do this throughout -- during indexing and metadata gen.
export function normalizeCldr(cldr: string): string {
  return cldr
    .replaceAll('-', '_')
    .replaceAll(' ', '_')
    .replaceAll(/\(\)/g, '')
    .toLowerCase();
}

export class EmojiMetadataReader {
  private allCache: Record<EmojiFamily, Record<string, IEmoji> | null> = {
    [EmojiFamily.FLUENT_UI]: null,
    [EmojiFamily.NOTO]: null,
  };

  constructor(
    private importGlob?: (
      pattern: string,
    ) => Record<string, () => Promise<{ default: Record<string, IEmoji> }>>,
  ) {}

  async get(family: EmojiFamily, cldr: string): Promise<IEmoji | undefined> {
    if (this.allCache === null || !this.allCache[family]) {
      return (await this.all(family))[cldr];
    }

    return this.allCache[family] ? this.allCache[family][cldr] : undefined;
  }

  async all(family: EmojiFamily): Promise<Record<string, IEmoji>> {
    if (this.allCache[family] !== null) {
      return this.allCache[family];
    }

    try {
      const metadataPaths = this.importGlob
        ? this.importGlob('../../Artifacts/*-Metadata.json')
        : import.meta.glob('../../Artifacts/*-Metadata.json');
      const foundMetadataPath = Object.keys(metadataPaths).filter(
        (metadataPath) => metadataPath.endsWith(getFamilyMetadataFile(family)),
      )[0];
      const { default: metadata } = await metadataPaths[foundMetadataPath]();

      this.allCache[family] = metadata;

      return metadata;
    } catch (error) {
      if (!(error instanceof TypeError)) {
        throw error;
      }

      // NOTE(nicholas-ramsey): This is required due to the varying runtimes we're using (tsx vs browser).
      // `import.meta.glob` is a Vite construct (if I'm not mistaken). And `import` isn't working for the
      // browser due to a `Failed to load module script: Expected a JavaScript module script` error. :)
      const { default: metadata } = await import(
        /* @vite-ignore */
        `../../Artifacts/${getFamilyMetadataFile(family)}`
      );

      this.allCache[family] = metadata;

      return metadata;
    }
  }
}
