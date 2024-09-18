import { mkdir } from 'fs/promises';
import { join, basename, parse } from 'path';
import {
  publicPathFromUrl,
  createDirectories,
  removeDirectories,
  validateStyles,
  copyFiles,
} from '../src/lib/family-builders/utils';
import { IEmoji, EmojiFamily, IEmojiStyle } from '../src/lib/emojis/EmojiTypes';
import { FluentUIFamilyBuilder } from '../src/lib/family-builders/FluentUIFamilyBuilder';
import { NotoFamilyBuilder } from '../src/lib/family-builders/NotoFamilyBuilder';
import { EmojiMetadataWriter } from '../src/lib/emojis/EmojiMetadataWriter';
import { EmojiMapper } from '../src/lib/family-builders/unicode/EmojiMapper';
import { CLDRReader } from '../src/lib/family-builders/unicode/CLDRReader';
import {
  EmojiWithoutSpritesheetInfo,
  EmojiStyleWithoutSpritesheetInfo,
} from '../src/lib/family-builders/BuilderTypes';
import { SpreetSpritesheetGenerator } from '../src/lib/spritesheet-generators/SpreetSpritesheetGenerator';
import {
  ISpritesheetGenerator,
  ISpritesheetEmoji,
} from '../src/lib/spritesheet-generators/SpritesheetTypes';
import {
  getSkintoneGroup,
  getSkintoneSpritesheet,
} from '../src/lib/emojis/utils';

if (process.argv.length < 4) {
  throw new Error(
    'Must pass two CLI args: <EMOJI_METADATA_OUTPUT_PATH> <EMOJI_CLDR_ROOT_PATH>',
  );
}

const metadataOutputPath = process.argv[2];
const emojiCldrRootPath = join(process.argv[3], 'common');

const emojisDefaultPublicDirectory = join('public', 'emojis');

interface IFamilyBuilder {
  build(): Promise<Record<string, EmojiWithoutSpritesheetInfo>>;
}

/**
 * Groups emoji styles by their skintone (`EmojiSkintone`) or `EmojiSkintone.DEFAULT`
 */
function groupStylesBySkintone(
  metadata: Record<string, EmojiWithoutSpritesheetInfo>,
): Record<string, EmojiStyleWithoutSpritesheetInfo[]> {
  const stylesByGroup: Record<string, EmojiStyleWithoutSpritesheetInfo[]> = {};

  for (const emojiEntry of Object.values(metadata)) {
    for (const emojiStyle of Object.values(emojiEntry.styles)) {
      const normalizedStyleGroup = parse(
        // NOTE(nicholas-ramsey): Using `getSkintoneSpritesheet` to ensure we're consistent across build and runtime.
        getSkintoneSpritesheet(
          getSkintoneGroup({
            ...emojiStyle,
            height: null,
            width: null,
            x: null,
            y: null,
          }),
        ),
      ).name;

      if (!stylesByGroup[normalizedStyleGroup]) {
        stylesByGroup[normalizedStyleGroup] = [];
      }

      stylesByGroup[normalizedStyleGroup].push(emojiStyle);
    }
  }

  return stylesByGroup;
}

async function processFamily({
  familyName,
  familyBuilder,
  emojisDefaultPublicDirectory,
  emojiMetadataWriter,
  metadataOutputPath,
  spritesheetGenerator,
}: {
  familyName: string;
  familyBuilder: IFamilyBuilder;
  emojisDefaultPublicDirectory: string;
  emojiMetadataWriter: EmojiMetadataWriter;
  metadataOutputPath: string;
  spritesheetGenerator: ISpritesheetGenerator;
}): Promise<void> {
  const familyBasePath = join(
    emojisDefaultPublicDirectory,
    familyName.toLowerCase(),
  );
  const metadata = await familyBuilder.build();
  const stylesBySkintone = groupStylesBySkintone(metadata);

  const styleDirectories = Object.keys(stylesBySkintone).map((styleGroup) =>
    join(familyBasePath, styleGroup),
  );

  await createDirectories(...styleDirectories);

  for (const [styleName, styles] of Object.entries(stylesBySkintone)) {
    await copyFiles(
      join(familyBasePath, styleName),
      ...styles.map((style) => publicPathFromUrl(style.url)),
    );
  }

  const spritesheetMetadataByStyle: Record<
    string,
    Record<string, ISpritesheetEmoji>
  > = {};

  for (const styleName of Object.keys(stylesBySkintone)) {
    spritesheetMetadataByStyle[styleName] = await spritesheetGenerator.generate(
      {
        outputPath: join(familyBasePath, styleName),
        imagesInputPath: join(familyBasePath, styleName),
      },
    );
  }

  const allMetadata: Record<string, IEmoji> = {};

  for (const emojiEntry of Object.values(metadata)) {
    const updatedStyles = Object.fromEntries(
      Object.entries(emojiEntry.styles).map(([styleName, style]) => {
        const styleFile = basename(publicPathFromUrl(style.url));
        const parsedStyleFile = parse(styleFile);
        const isSVG = parsedStyleFile.ext === '.svg';

        const spritesheetInfo = Object.entries(
          spritesheetMetadataByStyle[
            getSkintoneGroup({
              ...style,
              height: null,
              width: null,
              x: null,
              y: null,
            })
          ],
        ).find(([spriteName]) => parsedStyleFile.name === spriteName)?.[1];

        // NOTE(nicholas-ramsey): Some families don't expose SVGs for all emojis. In those cases,
        // our spritesheet generator can't handle them. So, they won't be in the spritesheet.
        if (!spritesheetInfo && isSVG) {
          throw new Error(
            `Unable to find spritesheet info for '${emojiEntry.id}' style '${style.id}' (url: '${style.url}', fileName: '${parsedStyleFile.name}')`,
          );
        }

        return [
          styleName,
          {
            ...style,
            height: spritesheetInfo?.height ?? null,
            width: spritesheetInfo?.width ?? null,
            x: spritesheetInfo?.x ?? null,
            y: spritesheetInfo?.y ?? null,
          } as IEmojiStyle,
        ];
      }),
    );

    if (!validateStyles(emojiEntry.defaultStyle, updatedStyles)) {
      throw new Error(
        `Failed to validate style for emoji '${emojiEntry.id}' (defaultStyle: '${emojiEntry.defaultStyle}'). Its styles are invalid: ${JSON.stringify(emojiEntry.styles)}`,
      );
    }

    allMetadata[emojiEntry.id] = {
      ...emojiEntry,
      styles: updatedStyles,
    } as IEmoji;
  }

  await removeDirectories(...styleDirectories);

  await emojiMetadataWriter.write(
    EmojiFamily[familyName],
    metadataOutputPath,
    allMetadata,
  );
}

(async () => {
  await mkdir(emojisDefaultPublicDirectory, { recursive: true });

  const emojiMetadataWriter = new EmojiMetadataWriter();
  const cldrReader = new CLDRReader();
  const cldrData = await cldrReader.loadMultiple([
    join(emojiCldrRootPath, 'annotations', 'en.xml'),
    // English (World) locale
    join(emojiCldrRootPath, 'annotations', 'en_001.xml'),
    join(emojiCldrRootPath, 'annotationsDerived', 'en.xml'),
    // English (World) locale
    join(emojiCldrRootPath, 'annotationsDerived', 'en_001.xml'),
  ]);
  const emojiMapper = new EmojiMapper(cldrData);
  const emojiData = await emojiMapper.build();

  const familyBuilders: Record<EmojiFamily, IFamilyBuilder> = {
    [EmojiFamily.FLUENT_UI]: new FluentUIFamilyBuilder(
      join(emojisDefaultPublicDirectory, 'fluent_ui', 'all'),
      join(emojisDefaultPublicDirectory, 'fluent_ui'),
      'scripts/assets/fluentui-emoji/assets/',
    ),
    [EmojiFamily.NOTO]: new NotoFamilyBuilder(
      join(emojisDefaultPublicDirectory, 'noto', 'all'),
      join(emojisDefaultPublicDirectory, 'noto'),
      'scripts/assets/noto-emoji/',
      emojiData,
    ),
  };

  const spritesheetGenerator = new SpreetSpritesheetGenerator();

  for (const [familyName, familyBuilder] of Object.entries(familyBuilders)) {
    console.log(`Building metadata for family ${familyName}...`);

    await processFamily({
      familyBuilder,
      familyName,
      emojiMetadataWriter,
      emojisDefaultPublicDirectory,
      metadataOutputPath,
      spritesheetGenerator,
    });

    console.log(`Built metadata for family ${familyName}`);
  }
})();
