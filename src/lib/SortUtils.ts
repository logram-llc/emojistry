import { IEmoji, CIELABTuple } from './emojis/EmojiTypes';
import { deltaE94 } from '../ColorUtils';

export interface IEmojiSortComparator {
  (emoji1: IEmoji, emoji2: IEmoji): number;
}

// NOTE(j-ramsey): This is used as an anchor point for determining the
// difference between two CIELAB colors while sorting.
const DELTA_E94_SORT_REFERENCE_COLOR: CIELABTuple = [0, 0, 0];

export function deltaE94SortComparator(emojiA: IEmoji, emojiB: IEmoji): number {
  // NOTE(j-ramsey): Considering only the most prominent color
  const deltaE_A = deltaE94(
    DELTA_E94_SORT_REFERENCE_COLOR,
    emojiA.styles[emojiA.defaultStyle].colorPalette[0].CIELAB,
  );
  const deltaE_B = deltaE94(
    DELTA_E94_SORT_REFERENCE_COLOR,
    emojiB.styles[emojiB.defaultStyle].colorPalette[0].CIELAB,
  );

  return deltaE_A - deltaE_B;
}

export function cldrSortComparator(emojiA: IEmoji, emojiB: IEmoji): number {
  return emojiA.cldr.localeCompare(emojiB.cldr);
}

export function groupAlphabeticSortComparator(
  emojiA: IEmoji,
  emojiB: IEmoji,
): number {
  if (emojiA.group > emojiB.group) {
    return 1;
  }
  if (emojiA.group < emojiB.group) {
    return -1;
  }

  return 0;
}
