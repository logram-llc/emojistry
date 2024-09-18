import { EmojiFamily, IEmojiStyle, EmojiSkintone } from './EmojiTypes';

export function normalizeFamilyName(family: EmojiFamily): string {
  return family.replaceAll(' ', '_').toLowerCase();
}

export function getFamilyMetadataFile(family: EmojiFamily): string {
  return `${normalizeFamilyName(family)}-Metadata.json`;
}

export function getFamilySearchIndexFile(family: EmojiFamily): string {
  return `${normalizeFamilyName(family)}-SearchIndex.json`;
}

/**
 * Returns the spritesheet name for a skintone (e.g. `Dark.png`, `Medium-Light.png`)
 */
export function getSkintoneSpritesheet(skintone: EmojiSkintone): string {
  return `${skintone}.png`;
}

/**
 * Returns the skintone group for a skintone-based emoji, otherwise `EmojiSkintone.DEFAULT`
 */
export function getSkintoneGroup(style: IEmojiStyle): EmojiSkintone {
  // NOTE(nicholas-ramsey): We need to sort by length. We want to find matches for `Medium Dark` before `Dark`.
  const skintoneStyles = Object.values(EmojiSkintone).sort(
    (skintoneA, skintoneB) => skintoneB.length - skintoneA.length,
  );

  return (
    skintoneStyles.find((validStyle) =>
      style.group.toLowerCase().includes(validStyle.toLowerCase()),
    ) ?? EmojiSkintone.DEFAULT
  );
}
