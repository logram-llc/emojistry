import { writeFile, readdir, readFile } from 'fs/promises';
import { join, parse } from 'path';
import {
  EmojiSkintone,
  MISSING_EMOJI_GROUP,
  SKINTONES_BY_MODIFIER,
} from '@/lib/emojis/EmojiTypes';
import { normalizeCldr } from '@/lib/emojis/EmojiMetadataReader';
import {
  getColorPaletteFromSVG,
  urlFromPublicPath,
  modifySvgDimensions,
  createDirectories,
} from './utils';
import { EmojiDataMap } from './unicode/EmojiMapper';
import { EmojiWithoutSpritesheetInfo } from './BuilderTypes';

interface IEmojiBuild {
  spriteName: string;
  skintoneEntity: string | null;
  skintone: EmojiSkintone | null;
  svgPath: string;
  emojiMetadata: EmojiWithoutSpritesheetInfo;
}

interface IMissingAnnotation {
  tts: string;
  shortName: string;
  category: string;
  subcategory: string;
}

// NOTE(nicholas-ramsey): These are emojis that are included by Noto but are missing in our EmojiMapper (most likely due to not being in emoji-datasource).
const MissingAnnotationsBySprite: Record<string, IMissingAnnotation> = {
  emoji_ufe82b: {
    tts: 'question mark flag',
    shortName: 'question mark flag',
    category: 'Symbols',
    subcategory: 'Flags',
  },
  emoji_u1f93c_1f3fb: {
    tts: 'person wrestling: light skin tone',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fb_200d_2642: {
    tts: 'person wrestling: light skin tone, male',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fb_200d_2640: {
    tts: 'person wrestling: light skin tone, female',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fc: {
    tts: 'person wrestling: medium-light skin tone',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fc_200d_2640: {
    tts: 'person wrestling: medium-light skin tone, female',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fc_200d_2642: {
    tts: 'person wrestling: medium-light skin tone, male',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fd: {
    tts: 'person wrestling: medium skin tone',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fd_200d_2640: {
    tts: 'person wrestling: medium skin tone, female',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fd_200d_2642: {
    tts: 'person wrestling: medium skin tone, male',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fe: {
    tts: 'person wrestling: medium-dark skin tone',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fe_200d_2640: {
    tts: 'person wrestling: medium-dark skin tone, female',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3fe_200d_2642: {
    tts: 'person wrestling: medium-dark skin tone, male',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3ff: {
    tts: 'person wrestling: dark skin tone',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3ff_200d_2640: {
    tts: 'person wrestling: dark skin tone, female',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  emoji_u1f93c_1f3ff_200d_2642: {
    tts: 'person wrestling: dark skin tone, male',
    shortName: 'wrestlers',
    category: 'People & Body',
    subcategory: 'person-sport',
  },
  ...createMissingAnnotationRanges(
    0x0030,
    0x0039,
    'emoji_u',
    {
      shortName: 'number keycap',
      category: 'Symbols',
      subcategory: 'keycap',
    },
    (codePoint) => {
      return `number ${String.fromCodePoint(codePoint)}`;
    },
  ),
  ...createMissingAnnotationRanges(
    0x0030,
    0x0039,
    'emoji_u',
    {
      shortName: 'number keycap',
      category: 'Symbols',
      subcategory: 'keycap',
    },
    (codePoint) => {
      return `number ${String.fromCodePoint(codePoint)}`;
    },
    '_20e3',
  ),
  emoji_u20e3: {
    tts: 'combining enclosing keycap',
    shortName: 'combining enclosing keycap',
    category: 'Symbols',
    subcategory: 'keycap',
  },
  ...createMissingAnnotationRanges(
    0x1f1e6,
    0x1f1ff,
    'emoji_u',
    {
      shortName: 'regional indicator symbol letter',
      category: 'Flags',
      subcategory: 'regional-indicator-symbols',
    },
    (codePoint) => {
      const letter = String.fromCodePoint(codePoint);

      return `regional indicator symbol letter ${letter}`;
    },
  ),
  // Hairstyles
  emoji_u1f9b0: {
    tts: 'red hair',
    shortName: 'red_hair',
    category: 'Component',
    subcategory: 'hair-style',
  },
  emoji_u1f9b1: {
    tts: 'curly hair',
    shortName: 'curly_hair',
    category: 'Component',
    subcategory: 'hair-style',
  },
  emoji_u1f9b2: {
    tts: 'bald',
    shortName: 'bald',
    category: 'Component',
    subcategory: 'hair-style',
  },
  emoji_u1f9b3: {
    tts: 'white hair',
    shortName: 'white_hair',
    category: 'Component',
    subcategory: 'hair-style',
  },
};

function createMissingAnnotationRanges(
  startRange: number,
  endRange: number,
  keyPrefix: string,
  value: Omit<IMissingAnnotation, 'tts'>,
  ttsCreator: (codePoint: number) => string,
  keySuffix?: string,
): Record<string, IMissingAnnotation> {
  const output: Record<string, IMissingAnnotation> = {};

  for (let code = startRange; code <= endRange; code++) {
    const hexCode = code.toString(16).toLowerCase().padStart(4, '0');

    output[`${keyPrefix}${hexCode}${keySuffix ?? ''}`] = {
      ...value,
      tts: ttsCreator(code),
    };
  }

  return output;
}

function convertToCodePoint(str: string): string {
  const hexParts = str.replace(/^emoji_u/, '').split('_');

  return hexParts
    .map((hex) => String.fromCodePoint(parseInt(hex, 16)))
    .join('');
}

/**
 * Returns the `EmojiSkintone` given a spritename's _modifier_.
 */
function getSkintoneModifierBySpriteName(
  spriteName: string,
): EmojiSkintone | null {
  const parts = spriteName.split('_');

  for (let part of parts) {
    part = part.startsWith('u') ? part.slice(1) : part;

    const hexCode = parseInt(part, 16);

    if (hexCode in SKINTONES_BY_MODIFIER && parts.length > 2) {
      return SKINTONES_BY_MODIFIER[
        hexCode as keyof typeof SKINTONES_BY_MODIFIER
      ];
    }
  }

  return null;
}

export class NotoFamilyBuilder {
  private _spritesheetOutputPath: string;
  private _emojisPublicDirectory: string;
  private _emojisAllPublicDirectory: string;
  private _notoRepoPath: string;
  private _emojiData: EmojiDataMap;

  constructor(
    spritesheetOutputPath: string,
    emojisPublicDirectory: string,
    notoRepoPath: string,
    emojiData: EmojiDataMap,
  ) {
    this._spritesheetOutputPath = spritesheetOutputPath;
    this._emojisPublicDirectory = emojisPublicDirectory;
    this._notoRepoPath = notoRepoPath;
    this._emojiData = emojiData;
    this._emojisAllPublicDirectory = join(this._emojisPublicDirectory, 'all');
  }

  readEmojiEntry(svgPath: string): IEmojiBuild | null {
    const spriteName = parse(svgPath).name;
    const codePoint = convertToCodePoint(spriteName);

    if (codePoint === '0') {
      return null;
    }

    const foundEmoji =
      this._emojiData.getEmojiByCodepoint(codePoint) ??
      this._emojiData.getEmojiByVariant(codePoint)?.base ??
      this._emojiData.getEmojiByCodepointMatch(codePoint);

    const emojiTTS = foundEmoji?.tts?.length
      ? foundEmoji.tts.join(' ')
      : MissingAnnotationsBySprite[spriteName]?.tts || '';

    const emojiGroup =
      foundEmoji?.category ??
      MissingAnnotationsBySprite[spriteName]?.category ??
      MISSING_EMOJI_GROUP;
    const emojiSubgroup =
      foundEmoji?.subcategory ??
      MissingAnnotationsBySprite[spriteName]?.subcategory ??
      '';

    const skintone = getSkintoneModifierBySpriteName(spriteName);
    const isSkintoneBased = skintone !== null || Boolean(foundEmoji?.variants);
    const skintoneEntity = isSkintoneBased
      ? (foundEmoji?.shortName ??
        MissingAnnotationsBySprite[spriteName]?.shortName)
      : null;

    if (!emojiTTS) {
      throw new Error(
        `Cannot determine emoji text for '${spriteName}' (tts='${emojiTTS}',cp='${codePoint}')`,
      );
    }
    if (isSkintoneBased && !skintoneEntity) {
      throw new Error(`Failed to determine skintone for ${emojiTTS}`);
    }

    return {
      emojiMetadata: {
        id: spriteName,
        cldr: emojiTTS,
        group: emojiGroup,
        keywords: Array.from(
          new Set([...(foundEmoji?.keywords ?? []), emojiSubgroup]),
        ),
        tts: emojiTTS,
        family: 'Noto',
        familyVersion: '',
        glyph: codePoint,
        defaultStyle: 'Default',
        styles: {},
      },
      svgPath,
      spriteName: spriteName,
      skintoneEntity: isSkintoneBased ? skintoneEntity : null,
      skintone: skintoneEntity ? (skintone ?? EmojiSkintone.DEFAULT) : null,
    };
  }

  async readEmojiMetadata(
    basePath: string,
  ): Promise<Record<string, IEmojiBuild>> {
    const output: Record<string, IEmojiBuild> = {};

    const svgBasePath = join(basePath, 'svg');

    for (const svgPath of await readdir(svgBasePath)) {
      if (!svgPath.endsWith('.svg')) {
        continue;
      }
      // NOTE(nicholas-ramsey): We need to resize the SVGs to match the others family's SVGs so the emoji scale matches on each spritesheet.
      const resizedSvgContents = modifySvgDimensions(
        await readFile(join(svgBasePath, svgPath), 'utf-8'),
        '32',
        '32',
      );

      const emojiEntry = this.readEmojiEntry(svgPath);

      if (!emojiEntry) {
        continue;
      }

      output[parse(svgPath).name] = emojiEntry;

      await writeFile(
        join(this._emojisAllPublicDirectory, svgPath),
        resizedSvgContents,
      );
    }

    return output;
  }

  async createEmojiDirectories(): Promise<void> {
    await createDirectories(
      this._emojisAllPublicDirectory,
      this._spritesheetOutputPath,
    );
  }

  async build(): Promise<Record<string, EmojiWithoutSpritesheetInfo>> {
    await this.createEmojiDirectories();

    const metadataBuilds = await this.readEmojiMetadata(this._notoRepoPath);
    const metadataBySpriteName = Object.fromEntries(
      Object.values(metadataBuilds).map((build) => [build.spriteName, build]),
    );

    const emojiMetadata: Record<
      string,
      Pick<IEmojiBuild, 'emojiMetadata' | 'spriteName'>
    > = {};

    for (const [emojiId, emojiBuild] of Object.entries(metadataBuilds)) {
      // NOTE(nicholas-ramsey): Not skintone-based or default skintone.
      if (
        !emojiBuild.skintone ||
        emojiBuild.skintone === EmojiSkintone.DEFAULT
      ) {
        emojiMetadata[emojiId] = {
          emojiMetadata: emojiBuild.emojiMetadata,
          spriteName: emojiBuild.spriteName,
        };

        emojiMetadata[emojiId].emojiMetadata.styles = {
          ...emojiBuild.emojiMetadata.styles,
          Default: {
            id: 'Default',
            label: 'Default',
            group: 'Default',
            url: urlFromPublicPath(
              join(this._emojisAllPublicDirectory, emojiBuild.svgPath),
            ),
            isSvg: true,
            colorPalette: [],
          },
        };

        continue;
      }

      const baseEmojiMetadata =
        metadataBySpriteName[
          emojiBuild.spriteName.split('_').slice(0, 2).join('_')
        ];

      if (!baseEmojiMetadata) {
        throw new Error(
          `Could not determine a base emoji entity for variation (such as skintone): '${emojiBuild.skintoneEntity}' ${emojiBuild.spriteName}`,
        );
      }

      const emojiEntry = emojiMetadata[baseEmojiMetadata.emojiMetadata.id];

      if (!emojiEntry.emojiMetadata.styles) {
        emojiEntry.emojiMetadata.styles = {};
      }

      emojiEntry.emojiMetadata.styles = {
        ...emojiEntry.emojiMetadata.styles,
        [`${emojiBuild.skintone}_${emojiBuild.skintoneEntity}`]: {
          id: `${emojiBuild.skintone}_${emojiBuild.skintoneEntity}`,
          label: `${emojiBuild.skintone} ${emojiBuild.skintoneEntity}`,
          group: emojiBuild.skintone.toString(),
          url: urlFromPublicPath(
            join(this._emojisAllPublicDirectory, emojiBuild.svgPath),
          ),
          isSvg: true,
          colorPalette: [],
        },
      };
    }

    // TODO(nicholas-ramsey): These SVGs are causing a panic with resvg:
    //  thread '<unnamed>' panicked at C:\Users\runneradmin\.cargo\git\checkouts\resvg-4b7e4ee32ad6d954\3495d87\crates\resvg\src\geom.rs:27:61:
    //  called `Option::unwrap()` on a `None` value
    //  note: run with `RUST_BACKTRACE=1` environment variable to display a backtrace
    const problematicSvgs = new Set<string>([
      'emoji_u1f3f3_200d_1f308',
      'emoji_u1f4e6',
    ]);

    const allEmojiMetadataBySpriteName = Object.fromEntries(
      Object.values(emojiMetadata).map((metadata) => [
        metadata.spriteName,
        metadata,
      ]),
    );

    const allMetadata: Record<string, EmojiWithoutSpritesheetInfo> = {};

    for (const [spriteName, emojiEntry] of Object.entries(
      allEmojiMetadataBySpriteName,
    )) {
      console.log(`Processing sprite ${spriteName}`);

      if (problematicSvgs.has(spriteName)) {
        continue;
      }

      const normalizedCldr = normalizeCldr(emojiEntry.emojiMetadata.cldr);

      await Promise.all(
        Object.values(emojiEntry.emojiMetadata.styles).map(async (style) => {
          const svgPath = join('public', style.url);
          style.colorPalette = await getColorPaletteFromSVG(svgPath);
        }),
      );

      allMetadata[normalizedCldr] = {
        ...emojiEntry.emojiMetadata,
        id: normalizedCldr,
        cldr: normalizedCldr,
      };
    }

    return allMetadata;
  }
}
