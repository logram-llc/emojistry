import { IndexOptionsForDocumentSearch } from 'flexsearch';
import FlexSearch from 'flexsearch';

export interface IEmojiDocument {
  cldr: string;
  keywords: string[];
  tts: string;
  group: string;
}

export type EmojiIndexerConfig = {
  workerMode: boolean;
};

export const defaultIndexerConfig: IndexOptionsForDocumentSearch<
  IEmojiDocument,
  false
> = {
  preset: 'match',
  tokenize: 'forward',
  resolution: 5,
  language: 'en',
  document: {
    id: 'cldr',
    index: [
      {
        field: 'keywords',
        tokenize: 'forward',
        optimize: true,
        resolution: 9,
      },
      {
        field: 'tts',
        tokenize: 'forward',
        optimize: true,
        resolution: 9,
      },
      {
        field: 'group',
        tokenize: 'reverse',
        optimize: true,
        resolution: 9,
      },
    ],
  },
};

export class EmojiIndexer {
  constructor(
    private index: FlexSearch.Document<
      IEmojiDocument,
      false
    > = new FlexSearch.Document<IEmojiDocument, false>({
      ...defaultIndexerConfig,
    }),
  ) {
    this.index = index;
  }

  /**
   * Adds an emoji document to the index.
   * @param emojiDocument - The emoji document to index.
   */
  addEmojiDocument(emojiDocument: IEmojiDocument): void {
    this.index.add(emojiDocument);
  }

  search(query: string, limit?: number) {
    return this.index.search(query, limit);
  }

  export(): Promise<Record<string | number, IEmojiDocument>> {
    return new Promise((resolve) => {
      const dIndex: Record<string | number, IEmojiDocument> = {};

      this.index.export((key, data) => {
        if (data === undefined) {
          return;
        }

        dIndex[key] = data;
      });

      // NOTE(jordan-ramsey): Need to do this since the
      // above callback is called multiple times. And we
      // can't know exactly when it's done exporting.
      setTimeout(() => {
        resolve(dIndex);
      }, 250);
    });
  }

  static fromIndex(
    data: Record<string | number, IEmojiDocument>,
  ): EmojiIndexer {
    const indexer = new this();

    for (const [key, val] of Object.entries(data)) {
      indexer.index.import(key, val);
    }

    return indexer;
  }
}
