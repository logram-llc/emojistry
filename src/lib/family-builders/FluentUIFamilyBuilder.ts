import { readFile, readdir } from 'fs/promises';
import { join, basename, extname } from 'path';
import { EmojiSkintone } from '@/lib/emojis/EmojiTypes';
import { normalizeCldr } from '@/lib/emojis/EmojiMetadataReader';
import {
  getColorPaletteFromSVG,
  getColorPaletteFromPNG,
  urlFromPublicPath,
  createDirectories,
  copyFiles,
} from './utils';
import {
  EmojiStyleWithoutSpritesheetInfo,
  EmojiWithoutSpritesheetInfo,
} from './BuilderTypes';

interface IFluentUIMetadata {
  cldr: string;
  fromVersion: string;
  glyph: string;
  glyphAsUtfInEmoticons: string[];
  group: string;
  keywords: string[];
  mappedToEmoticons: string[];
  tts: string;
  unicode: string;
  unicodeSkintones?: string[];
}

interface IEmojiBuildEntry extends IFluentUIMetadata {
  isSkintoneBased: boolean;
  styles: Record<string, string>;
  skintones?: Record<string, Record<string, string>>;
  defaultSvgName?: string;
  spriteName?: string;
  svgUrl?: string;
}

interface IEmojiBuild extends Omit<IEmojiBuildEntry, 'styles'> {
  defaultSvgName: string;
  spriteName: string;
  svgUrl: string;
  defaultStyle: string;
  styles: Record<string, EmojiStyleWithoutSpritesheetInfo>;
}

// TODO(nicholas-ramsey): This is ugly.
/**
 * Replaces subsequent uppercase characters with a dash and the character (e.g. `MediumDark` -> `Medium-Dark`)
 */
function camcelCaseToKebab(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2');
}

// TODO(nicholas-ramsey): This is ugly too. Clean up.
export class FluentUIFamilyBuilder {
  private _spritesheetOutputPath: string;
  private _emojisPublicDirectory: string;
  private _emojisAllPublicDirectory: string;
  private _fluentUIRepoPath: string;

  constructor(
    spritesheetOutputPath: string,
    emojisPublicDirectory: string,
    fluentUIRepoPath: string,
  ) {
    this._spritesheetOutputPath = spritesheetOutputPath;
    this._emojisPublicDirectory = emojisPublicDirectory;
    this._fluentUIRepoPath = fluentUIRepoPath;
    this._emojisAllPublicDirectory = join(this._emojisPublicDirectory, 'all');
  }

  private async buildNonSkintoneStyles(
    basePath: string,
    folder: string,
    subfolders: Set<string>,
  ): Promise<Record<string, string>> {
    const styles: Record<string, string> = {};

    await Promise.all(
      [...subfolders].map(async (styleDir) => {
        styles[styleDir.replace(' ', '')] = join(
          basePath,
          folder,
          styleDir,
          (await readdir(`${basePath}/${folder}/${styleDir}`))[0],
        );
      }),
    );

    return styles;
  }

  private async buildSkintoneStyles(
    basePath: string,
    folder: string,
    subfolders: Set<string>,
  ): Promise<Record<string, Record<string, string>>> {
    const skintones: Record<string, Record<string, string>> = {};

    await Promise.all(
      [...subfolders].map(async (skintoneDir) => {
        const styleDirs = await readdir(`${basePath}/${folder}/${skintoneDir}`);
        const styles: Record<string, string> = {};

        await Promise.all(
          styleDirs.map(async (styleDir) => {
            styles[styleDir.replace(' ', '')] = join(
              basePath,
              folder,
              skintoneDir,
              styleDir,
              (
                await readdir(
                  `${basePath}/${folder}/${skintoneDir}/${styleDir}`,
                )
              )[0],
            );
          }),
        );

        skintones[skintoneDir.replace(/-/g, '')] = styles;
      }),
    );

    // Add 'HighContrast' entry for non-default skintones
    for (const skintone of Object.keys(skintones)) {
      if (skintone !== 'Default') {
        skintones[skintone]['HighContrast'] =
          skintones['Default']['HighContrast'];
      }
    }

    return skintones;
  }

  async constructEmojiBuildEntry(
    basePath: string,
    folder: string,
  ): Promise<IEmojiBuildEntry> {
    const skintoneBasedDir = new Set([
      'Dark',
      'Default',
      'Light',
      'Medium',
      'Medium-Dark',
      'Medium-Light',
    ]);
    const fluentUiMetadata: IFluentUIMetadata = JSON.parse(
      await readFile(`${basePath}/${folder}/metadata.json`, 'utf8'),
    );
    const emojiEntry: Partial<IEmojiBuildEntry> = {
      ...fluentUiMetadata,
      isSkintoneBased: false,
    };

    const subfolders = new Set(
      (await readdir(`${basePath}/${folder}`, { withFileTypes: true }))
        .filter((x) => x.isDirectory())
        .map((x) => x.name),
    );

    if (
      skintoneBasedDir.size === subfolders.size &&
      [...skintoneBasedDir].every((dir) => subfolders.has(dir))
    ) {
      emojiEntry.isSkintoneBased = true;
      emojiEntry.skintones = await this.buildSkintoneStyles(
        basePath,
        folder,
        subfolders,
      );
    } else {
      emojiEntry.styles = await this.buildNonSkintoneStyles(
        basePath,
        folder,
        subfolders,
      );
    }

    return emojiEntry as IEmojiBuildEntry;
  }

  private constructStyle({
    styleLabel,
    imagePath,
    skintoneLabel = EmojiSkintone.DEFAULT,
  }: {
    styleLabel: string;
    imagePath: string;
    skintoneLabel?: string;
  }): EmojiStyleWithoutSpritesheetInfo {
    const imageFilename = basename(imagePath);
    const isSvg = extname(imagePath) === '.svg';

    return {
      id:
        skintoneLabel === EmojiSkintone.DEFAULT
          ? styleLabel
          : `${skintoneLabel}_${styleLabel}`,
      label: styleLabel,
      group:
        skintoneLabel === EmojiSkintone.DEFAULT
          ? EmojiSkintone.DEFAULT
          : camcelCaseToKebab(skintoneLabel),
      url: join(this._emojisAllPublicDirectory, imageFilename),
      isSvg,
      colorPalette: [],
    };
  }

  async readEmojiMetadata(
    basePath: string,
  ): Promise<Record<string, IEmojiBuild>> {
    const folders = await readdir(basePath);
    const output: Record<string, IEmojiBuild> = {};

    for (const folder of folders) {
      const emojiEntry = await this.constructEmojiBuildEntry(basePath, folder);

      const getFirstFilename = async (path: string) => (await readdir(path))[0];
      const colorPath = emojiEntry.isSkintoneBased
        ? `${basePath}/${folder}/Default/Color/`
        : `${basePath}/${folder}/Color/`;
      const svgFilename = await getFirstFilename(colorPath);

      const emojiStyles: EmojiStyleWithoutSpritesheetInfo[] = [];

      if (emojiEntry.skintones) {
        const imagePaths = Object.values(emojiEntry.skintones).flatMap(
          (styleGroup) =>
            Object.values(styleGroup).map((imagePath) => imagePath),
        );
        await copyFiles(this._emojisAllPublicDirectory, ...new Set(imagePaths));

        const skintoneStyles = Object.entries(emojiEntry.skintones).flatMap(
          ([skintoneLabel, styleGroup]) =>
            Object.entries(styleGroup).map(([styleLabel, imagePath]) =>
              this.constructStyle({ styleLabel, imagePath, skintoneLabel }),
            ),
        );
        emojiStyles.push(...skintoneStyles);
      } else {
        const imagePaths = Object.values(emojiEntry.styles);
        await copyFiles(this._emojisAllPublicDirectory, ...new Set(imagePaths));

        emojiStyles.push(
          ...Object.entries(emojiEntry.styles).map(([styleLabel, imagePath]) =>
            this.constructStyle({ styleLabel, imagePath }),
          ),
        );
      }

      output[folder] = {
        ...emojiEntry,
        defaultSvgName: svgFilename,
        spriteName: basename(svgFilename, '.svg'),
        svgUrl: urlFromPublicPath(
          join(this._emojisAllPublicDirectory, svgFilename),
        ),
        // TODO(nicholas-ramsey): Isn't exactly clear how this is derived. When refactoring, clean this up as well.
        defaultStyle: 'Color',
        styles: emojiStyles.reduce(
          (acc, style) => ({ ...acc, [style.id]: style }),
          {},
        ),
      };
    }

    return output;
  }

  async createEmojiDirectories(): Promise<void> {
    await createDirectories(
      this._emojisAllPublicDirectory,
      this._spritesheetOutputPath,
    );
  }

  private async getColorPalette(style: EmojiStyleWithoutSpritesheetInfo) {
    return style.isSvg
      ? await getColorPaletteFromSVG(style.url)
      : await getColorPaletteFromPNG(style.url);
  }

  async build(): Promise<Record<string, EmojiWithoutSpritesheetInfo>> {
    await this.createEmojiDirectories();

    const emojiMetadata = await this.readEmojiMetadata(this._fluentUIRepoPath);
    const allMetadata: Record<string, EmojiWithoutSpritesheetInfo> = {};

    for (const emojiEntry of Object.values(emojiMetadata)) {
      const normalizedCldr = normalizeCldr(emojiEntry.cldr);

      await Promise.all(
        Object.values(emojiEntry.styles).map(async (style) => {
          style.colorPalette = await this.getColorPalette(style);
          style.url = urlFromPublicPath(style.url);
        }),
      );

      allMetadata[normalizedCldr] = {
        id: normalizedCldr,
        cldr: normalizedCldr,
        group: emojiEntry.group as string,
        keywords: emojiEntry.keywords as string[],
        tts: emojiEntry.tts as string,
        family: 'Fluent UI',
        familyVersion: emojiEntry.fromVersion,
        glyph: emojiEntry.glyph,
        styles: emojiEntry.styles,
        defaultStyle: emojiEntry.defaultStyle,
      };
    }

    if (Object.keys(allMetadata).length === 0) {
      throw new Error('Fluent UI metadata is empty');
    }

    return allMetadata;
  }
}
