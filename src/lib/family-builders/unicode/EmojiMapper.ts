import { IFilteredAnnotationResults } from '@/lib/family-builders/unicode/CLDRReader';
import EMOJI_DATASOURCE from 'emoji-datasource/emoji_pretty.json' with { type: 'json' };

interface IEmojiDataVariant {
  unified: string;
  nonQualified: string | null;
  emojiVersion: string;
  keywords: string[];
  tts: string[];
}

/**
 * Typing for the `emoji-datasource` package
 */
export interface IEmojiDataSource {
  name: string;
  unified: string;
  non_qualified: string | null;
  docomo: string | null;
  au: string | null;
  softbank: string | null;
  google: string | null;
  image: string;
  sheet_x: number;
  sheet_y: number;
  short_name: string;
  short_names: string[];
  text: string | null;
  texts: string[] | null;
  category: string;
  subcategory: string;
  sort_order: number;
  added_in: string;
  has_img_apple: boolean;
  has_img_google: boolean;
  has_img_twitter: boolean;
  has_img_facebook: boolean;
  skin_variations?: Record<
    string,
    | {
        unified: string;
        non_qualified: string | null;
        image: string;
        sheet_x: number;
        sheet_y: number;
        added_in: string;
        has_img_apple: boolean;
        has_img_google: boolean;
        has_img_twitter: boolean;
        has_img_facebook: boolean;
        obsoletes?: string | undefined;
        obsoleted_by?: string | undefined;
      }
    | undefined
  >;
  obsoletes?: string | undefined;
  obsoleted_by?: string | undefined;
}

export interface IEmojiData {
  name: string;
  unified: string;
  nonQualified: string | null;
  shortName: string;
  asciiEmoticons: string[];
  category: string;
  subcategory: string;
  emojiVersion: string;
  keywords: string[];
  tts: string[];
  variants: IEmojiDataVariant[];
}

interface IEmojiVariantRecord {
  base: IEmojiData;
  variant: IEmojiDataVariant;
}

export interface ICLDRData {
  findAnnotations(
    codePoint: string,
    type?: string | null,
  ): IFilteredAnnotationResults;
}

/**
 * Maps CLDR annotations with an emoji datasource, combining data as-needed.
 */
export class EmojiMapper {
  private _cldrData: ICLDRData;
  private _emojiDatasource: IEmojiDataSource[];

  constructor(
    cldrData: ICLDRData,
    emojiDatasource: IEmojiDataSource[] = EMOJI_DATASOURCE,
  ) {
    this._cldrData = cldrData;
    this._emojiDatasource = emojiDatasource;
  }

  /**
   * Breaks down a qualified sequence such as `0023-FE0F-20E3` into `[0023-FE0F-20E3, 0023-FE0F, 0023]`.
   * Doesn't take into account ZWJs (yet).
   */
  private decomposeQualifiedSequence(qualifiedSeq: string): string[] {
    const parts = qualifiedSeq.split('-');
    const decomposedParts: string[] = [];

    // NOTE(nicholas-ramsey): Gradually remove components from the right
    for (let i = parts.length; i > 0; i--) {
      decomposedParts.push(parts.slice(0, i).join('-'));
    }

    return decomposedParts;
  }

  private getAnnotations(
    unified: string,
    type?: string | null,
  ): IFilteredAnnotationResults | null {
    for (const decomposedPart of this.decomposeQualifiedSequence(unified)) {
      try {
        const codePoint = this.fromCodepoints(decomposedPart);
        const foundResults = this._cldrData.findAnnotations(codePoint, type);

        if (foundResults.annotations.length > 0) {
          return foundResults;
        }
      } catch (error) {
        if (error instanceof RangeError) {
          continue;
        }

        throw error;
      }
    }
    return null;
  }

  private getTTS(unified: string): string[] {
    const foundTTSResults = this.getAnnotations(unified, 'tts');

    const normalizedTTSResults = foundTTSResults
      ? foundTTSResults.annotations.map((ttsResult) => ttsResult.text)
      : [];

    return Array.from(new Set([...normalizedTTSResults]));
  }

  private getKeywords(unified: string, subcategory: string): string[] {
    const foundAnnotationResults = this.getAnnotations(unified);

    const normalizedAnnotationResults = foundAnnotationResults
      ? foundAnnotationResults.annotations
          .map((annotationResult) => annotationResult.text)
          .flatMap((text) => text.split(' | '))
      : [];

    return Array.from(
      new Set(
        [...normalizedAnnotationResults, subcategory].filter(
          (keyword) => keyword.trim().length > 0,
        ),
      ),
    );
  }

  private fromCodepoints(codePoints: string): string {
    const hexCodes = codePoints.split('-');

    return String.fromCodePoint(...hexCodes.map((code) => parseInt(code, 16)));
  }

  async build(): Promise<EmojiDataMap> {
    const qualifiedEmojiData: Record<string, IEmojiData> = {};
    const nonQualifiedEmojiData: Record<string, IEmojiData> = {};
    const qualifiedVariantData: Record<string, IEmojiVariantRecord> = {};
    const nonQualifiedVariantData: Record<string, IEmojiVariantRecord> = {};

    for (const emoji of this._emojiDatasource) {
      const codePoint = this.fromCodepoints(emoji.unified);

      const annotations = this.getKeywords(emoji.unified, emoji.subcategory);
      const tts = this.getTTS(emoji.unified);

      const emojiData: IEmojiData = {
        name: emoji.name,
        unified: emoji.unified,
        nonQualified: emoji.non_qualified,
        shortName: emoji.short_name,
        asciiEmoticons: emoji.texts ?? [],
        category: emoji.category,
        subcategory: emoji.subcategory,
        emojiVersion: emoji.added_in,
        keywords: annotations,
        tts,
        variants: [],
      };

      const processedSkinVariations = Object.values(
        emoji?.skin_variations ?? [],
      ).filter((value) => value !== undefined);

      emojiData.variants = processedSkinVariations.map((skinVariant) => {
        const skinVariantCodePoint = this.fromCodepoints(skinVariant.unified);

        const skinVariantData = {
          unified: skinVariant.unified,
          nonQualified: skinVariant.non_qualified,
          emojiVersion: skinVariant.added_in,
          keywords: this.getKeywords(skinVariant.unified, emoji.subcategory),
          tts: this.getTTS(skinVariant.unified),
        };

        qualifiedVariantData[skinVariantCodePoint] = {
          base: emojiData,
          variant: skinVariantData,
        };

        if (skinVariant.non_qualified) {
          nonQualifiedVariantData[
            this.fromCodepoints(skinVariant.non_qualified)
          ] = qualifiedVariantData[skinVariantCodePoint];
        }

        return skinVariantData;
      });

      qualifiedEmojiData[codePoint] = emojiData;

      if (emoji.non_qualified) {
        nonQualifiedEmojiData[this.fromCodepoints(emoji.non_qualified)] =
          emojiData;
      }
    }

    return new EmojiDataMap(
      qualifiedEmojiData,
      nonQualifiedEmojiData,
      qualifiedVariantData,
      nonQualifiedVariantData,
    );
  }
}

export class EmojiDataMap {
  private _qualifiedEmojiData: Readonly<Record<string, IEmojiData>>;
  private _nonQualifiedEmojiData: Record<string, IEmojiData>;
  private _qualifiedVariantData: Readonly<Record<string, IEmojiVariantRecord>>;
  private _nonQualifiedVariantData: Record<string, IEmojiVariantRecord>;

  constructor(
    qualifiedEmojiData: Record<string, IEmojiData>,
    nonQualifiedEmojiData: Record<string, IEmojiData>,
    qualifiedVariantData: Record<string, IEmojiVariantRecord>,
    nonQualifiedVariantData: Record<string, IEmojiVariantRecord>,
  ) {
    this._qualifiedEmojiData = Object.freeze(qualifiedEmojiData);
    this._nonQualifiedEmojiData = Object.freeze(nonQualifiedEmojiData);
    this._qualifiedVariantData = Object.freeze(qualifiedVariantData);
    this._nonQualifiedVariantData = Object.freeze(nonQualifiedVariantData);
  }

  private findMatchingKeyAndSource(
    codePointStartsWith: string,
    sources: Array<{
      record: Record<string, unknown>;
      type:
        | 'qualifiedEmojiData'
        | 'nonQualifiedEmojiData'
        | 'qualifiedVariantData'
        | 'nonQualifiedVariantData';
    }>,
  ): { key: string; sourceType: string } | null {
    for (const { record, type } of sources) {
      const foundKey = Object.keys(record).find((key) =>
        key.startsWith(codePointStartsWith),
      );
      if (foundKey) {
        return { key: foundKey, sourceType: type };
      }
    }
    return null;
  }

  getEmojiByCodepoint(codePoint: string): IEmojiData | null {
    return (
      this._qualifiedEmojiData[codePoint] ??
      this._nonQualifiedEmojiData[codePoint] ??
      null
    );
  }

  getEmojiByCodepointMatch(codePointStartsWith: string): IEmojiData | null {
    const foundEmojiKeyResult = this.findMatchingKeyAndSource(
      codePointStartsWith,
      [
        { record: this._qualifiedEmojiData, type: 'qualifiedEmojiData' },
        {
          record: this._nonQualifiedEmojiData,
          type: 'nonQualifiedEmojiData',
        },
      ],
    );

    if (foundEmojiKeyResult) {
      return foundEmojiKeyResult.sourceType === 'qualifiedEmojiData'
        ? this._qualifiedEmojiData[foundEmojiKeyResult.key]
        : this._nonQualifiedEmojiData[foundEmojiKeyResult.key];
    }

    const foundVariantResult = this.findMatchingKeyAndSource(
      codePointStartsWith,
      [
        { record: this._qualifiedVariantData, type: 'qualifiedVariantData' },
        {
          record: this._nonQualifiedVariantData,
          type: 'nonQualifiedVariantData',
        },
      ],
    );

    if (foundVariantResult) {
      return foundVariantResult.sourceType === 'qualifiedVariantData'
        ? this._qualifiedVariantData[foundVariantResult.key]?.base
        : this._nonQualifiedVariantData[foundVariantResult.key]?.base;
    }

    return null;
  }

  getEmojiByVariant(codePoint: string): IEmojiVariantRecord | null {
    return (
      this._qualifiedVariantData[codePoint] ??
      this._nonQualifiedVariantData[codePoint] ??
      null
    );
  }
}
