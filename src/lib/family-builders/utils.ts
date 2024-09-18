import { readFile, mkdir, rm, copyFile } from 'fs/promises';
import { renderAsync } from '@resvg/resvg-js';
import { normalize, sep as pathSep, basename, join } from 'path';
import { XMLParser, XMLBuilder } from 'fast-xml-parser';
import Vibrant from 'node-vibrant';
import { rgbToCIELab } from '@/ColorUtils';
import { ISwatch } from '@/lib/emojis/EmojiTypes';
import { toFixedNumber } from '@/lib/utils';
import { EmojiStyleWithoutSpritesheetInfo } from './BuilderTypes';

export async function getColorPaletteFromSVG(
  svgPath: string,
  dominantColorCount = 3,
): Promise<ISwatch[]> {
  const resvg = await renderAsync(await readFile(svgPath), {
    fitTo: {
      mode: 'width',
      value: 64,
    },
    font: {
      loadSystemFonts: false,
    },
  });
  const pngBuffer = resvg.asPng();

  return getColorPaletteFromPNG(pngBuffer, dominantColorCount);
}

export async function getColorPaletteFromPNG(
  pngSource: string | Buffer,
  dominantColorCount = 3,
): Promise<ISwatch[]> {
  const palette = await new Vibrant(pngSource, {
    colorCount: 64,
  }).getPalette();

  // NOTE(nicholas-ramsey): Fetching the most dominant colors.
  return Object.values(palette)
    .filter((swatch) => swatch !== null)
    .sort((a, b) => b.population - a.population)
    .slice(0, dominantColorCount)
    .map(
      (swatch) =>
        ({
          hex: swatch.hex,
          rgb: swatch.rgb,
          hsl: swatch.hsl.map((v) => toFixedNumber(v, 2, 10)),
          CIELAB: rgbToCIELab(swatch.r, swatch.g, swatch.b).map((v) =>
            toFixedNumber(v, 2, 10),
          ),
          occurrences: swatch.population,
        }) as ISwatch,
    );
}

/**
 * Retrieves what will be the URL from the `public/` path, taking into account system differences such as path seperators
 */
export function urlFromPublicPath(path: string): string {
  let url = normalize(path);
  const publicPrefix = `public${pathSep}`;

  if (url.startsWith(publicPrefix)) {
    url = url.substring(publicPrefix.length);
  }

  return `/${url}`;
}

/**
 * Converts a URL back to the `public/` path, taking into account system differences such as path separators
 */
export function publicPathFromUrl(url: string): string {
  const path = url.startsWith('/') ? url.substring(1) : url;

  const publicPrefix = `public${pathSep}`;

  return normalize(`${publicPrefix}${path}`);
}

export function modifySvgDimensions(
  svgContent: string,
  height: string,
  width: string,
): string {
  const parser = new XMLParser({ ignoreAttributes: false });
  const builder = new XMLBuilder({ ignoreAttributes: false });
  const svgObject = parser.parse(svgContent);

  if (svgObject.svg) {
    svgObject.svg['@_width'] = width;
    svgObject.svg['@_height'] = height;
  }

  return builder.build(svgObject);
}

export async function createDirectories(
  ...directories: string[]
): Promise<void> {
  await Promise.all(
    directories.map((directory) => mkdir(directory, { recursive: true })),
  );
}

export async function removeDirectories(
  ...directories: string[]
): Promise<void> {
  await Promise.all(
    directories.map((directory) => rm(directory, { recursive: true })),
  );
}

export async function copyFiles(
  directoryPath: string,
  ...filePaths: string[]
): Promise<void> {
  await Promise.all(
    filePaths.map((imagePath) =>
      copyFile(imagePath, join(directoryPath, basename(imagePath))),
    ),
  );
}

/**
 * Validates that an emojis styles are valid:
 *  1) The `defaultStyle` exists as a key of `styles`
 *  2) Keys of `styles` correspond to `styles[key].id`
 */
export function validateStyles(
  defaultStyle: string | undefined | null,
  styles: Record<string, EmojiStyleWithoutSpritesheetInfo>,
): boolean {
  const styleKeysMatchIds = Object.entries(styles).every(
    ([styleId, style]) => style.id === styleId,
  );
  const defaultStyleExists = defaultStyle
    ? Boolean(styles[defaultStyle])
    : false;

  return styleKeysMatchIds && defaultStyleExists;
}
