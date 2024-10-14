import { HTMLProps, forwardRef, useMemo, memo } from 'react';
import { cn } from '@/lib/utils';
import { EmojiFamily, EmojiSkintone, IEmoji } from '@/lib/emojis/EmojiTypes';
import styles from './AppGrid.module.css';
import {
  normalizeFamilyName,
  getSkintoneGroup,
  getSkintoneSpritesheet,
} from '@/lib/emojis/utils';
import { UrlManager } from '@/lib/UrlManager';
import { EMOJI_SIZE_IN_SPRITESHEET } from '@/components/app-grid/constants';

type EmojiProps = {
  emoji: IEmoji;
  selected: boolean;
  scale: number;
  emojiFamily: EmojiFamily;
  selectedSkintone: EmojiSkintone;
} & HTMLProps<HTMLAnchorElement>;

const Emoji = memo(
  forwardRef<HTMLAnchorElement, EmojiProps>(
    (
      {
        emoji,
        emojiFamily,
        selected,
        scale,
        selectedSkintone,
        style,
        ...props
      },
      ref,
    ) => {
      const emojiStyle = useMemo(() => {
        return (
          Object.values(emoji.styles)
            // NOTE(nicholas-ramsey): Ensure the spritesheet exists for the style. In some cases, it may not.
            .filter((style) => style.x !== null && style.y !== null)
            .find((style) => getSkintoneGroup(style) === selectedSkintone) ??
          emoji.styles[emoji.defaultStyle]
        );
      }, [emoji, selectedSkintone]);

      return (
        <a
          style={style}
          {...props}
          className={cn(
            styles.emoji,
            selected && styles['emoji--selected'],
            'group relative hover:z-50',
          )}
          tabIndex={0}
          ref={ref}
          role="tab"
          aria-selected={selected}
          href={UrlManager.getEmojiPath(emoji)}
          aria-label={`${emoji.family}'s ${emoji.tts} emoji`}
        >
          <div
            style={{
              width: EMOJI_SIZE_IN_SPRITESHEET,
              height: EMOJI_SIZE_IN_SPRITESHEET,
              backgroundPosition: `${-emojiStyle.x}px ${-emojiStyle.y}px`,
              backgroundImage: `url(/emojis/${normalizeFamilyName(
                emojiFamily,
              )}/${getSkintoneSpritesheet(getSkintoneGroup(emojiStyle))})`,
              transformOrigin: 'top left',
              transform: `scale(${scale})`,
            }}
          ></div>

          <span
            className={cn(
              styles['emoji-tooltip'],
              'group-hover:opacity-100 group-hover:scale-1',
            )}
          >
            {emoji.tts}
          </span>
        </a>
      );
    },
  ),
);

export { Emoji };
