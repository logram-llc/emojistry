import { IEmoji, IEmojiStyle } from '@/lib/emojis/EmojiTypes';

export type EmojiStyleWithoutSpritesheetInfo = Omit<
  IEmojiStyle,
  'height' | 'width' | 'x' | 'y'
>;

export type EmojiWithoutSpritesheetInfo = Omit<IEmoji, 'styles'> & {
  styles: Record<string, EmojiStyleWithoutSpritesheetInfo>;
};
