import React, {
  HTMLProps,
  useCallback,
  useState,
  useRef,
  useEffect,
  forwardRef,
  KeyboardEvent,
  useMemo,
} from 'react';
import { cn } from '@/lib/utils';
import { useEmojiGridSettings } from '@/providers/EmojiGridSettingsProvider';
import { EmojiFamily, EmojiSkintone, IEmoji } from '@/lib/emojis/EmojiTypes';
import styles from './AppGrid.module.css';
import { EmojiPanel } from '@/components/EmojiPanel';
import { useEmojiFamily } from '@/providers/EmojiFamilyProvider';
import {
  normalizeFamilyName,
  getSkintoneGroup,
  getSkintoneSpritesheet,
} from '@/lib/emojis/utils';
import { SeoManager } from '@/lib/SeoManager';
import { UrlManager } from '@/lib/UrlManager';

// TODO: Relocate to provider
const EMOJI_SIZE_IN_SPRITESHEET = 64;

interface EmojiGridProps {
  emojis: IEmoji[];
  urlManager: UrlManager;
  seoManager: SeoManager;
}

type EmojiProps = {
  emoji: IEmoji;
  selected: boolean;
  scale: number;
  emojiFamily: EmojiFamily;
  selectedSkintone: EmojiSkintone;
} & HTMLProps<HTMLAnchorElement>;

const Emoji = React.memo(
  forwardRef<HTMLAnchorElement, EmojiProps>(
    (
      { emoji, emojiFamily, selected, scale, selectedSkintone, ...props },
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

export const EmojiGrid = React.memo<EmojiGridProps>(
  ({ emojis, urlManager, seoManager }) => {
    const {
      settings: { showEmojiGroups, emojiSize, skintone },
    } = useEmojiGridSettings();
    const emojiPanelId = 'EmojiPanel';

    // TODO: Consolidate selectedEmoji to testable hook or something
    const [selectedEmoji, setSelectedEmoji] = useState<IEmoji | null>(null);
    const [emojiPanelOpen, setEmojiPanelOpen] = useState<boolean>(false);
    const selectedEmojiRef = useRef<HTMLAnchorElement | null>(null);
    const { emojiFamily } = useEmojiFamily();

    const emojiScale = useMemo(() => {
      return emojiSize / EMOJI_SIZE_IN_SPRITESHEET;
    }, [emojiSize]);

    useEffect(() => {
      urlManager.getEmoji().then((emojiFromUrl) => {
        if (emojiFromUrl) {
          setSelectedEmoji(emojiFromUrl);
          setEmojiPanelOpen(true);
          // TODO: Set selectedEmojiRef
        }
      });
    }, []);

    const handleEmojiClick = useCallback(
      (emoji: IEmoji) => {
        setSelectedEmoji(emoji);
        if (!emojiPanelOpen) {
          setEmojiPanelOpen(true);
        }
      },
      [emojiPanelOpen],
    );
    const handleEmojiKeyboardPress = useCallback(
      (event: KeyboardEvent<HTMLAnchorElement>, emoji: IEmoji) => {
        if (![' ', 'Enter'].includes(event.key)) {
          return;
        }

        event.preventDefault();

        handleEmojiClick(emoji);
      },
      [emojiPanelOpen],
    );

    useEffect(() => {
      urlManager.setEmoji(selectedEmoji);
      seoManager.setEmoji(selectedEmoji);

      if (selectedEmoji && selectedEmojiRef.current) {
        selectedEmojiRef.current.focus();
      }
    }, [emojiPanelOpen, selectedEmoji]);

    const groupedEmojis = React.useMemo(() => {
      const groups: Record<string, IEmoji[]> = {};

      for (const emoji of emojis) {
        if (!Object.hasOwn(groups, emoji.group)) {
          groups[emoji.group] = [];
        }
        groups[emoji.group].push(emoji);
      }

      return groups;
    }, [emojis]);

    const grid = !showEmojiGroups ? (
      <div
        className="grid mt-3"
        style={{
          gridTemplateColumns: `repeat(auto-fit, ${emojiSize}px)`,
          gridAutoRows: emojiSize,
          gap: 12 * emojiScale,
        }}
        role="tablist"
      >
        {emojis.map((emoji) => (
          <Emoji
            key={emoji.id}
            emoji={emoji}
            selected={Boolean(selectedEmoji && selectedEmoji.id === emoji.id)}
            onClick={(e) => {
              e.preventDefault();
              handleEmojiClick(emoji);
            }}
            onKeyDown={(event) => handleEmojiKeyboardPress(event, emoji)}
            role="listitem"
            ref={selectedEmoji?.id === emoji.id ? selectedEmojiRef : undefined}
            aria-controls={emojiPanelId}
            emojiFamily={EmojiFamily[emojiFamily]}
            scale={emojiScale}
            selectedSkintone={skintone}
          />
        ))}
      </div>
    ) : (
      <div className="overflow-hidden">
        {Object.entries(groupedEmojis).map(([emojiGroup, emojis]) => (
          <div key={emojiGroup} className="my-10 [&:first-child]:mt-3">
            <h2 className="text-sm tracking-wide mb-3 ml-1">{emojiGroup}</h2>
            <div
              className="grid"
              style={{
                gridTemplateColumns: `repeat(auto-fit, ${emojiSize}px)`,
                gridAutoRows: emojiSize,
                gap: 12 * emojiScale,
              }}
              role="tablist"
            >
              {emojis.map((emoji) => (
                <Emoji
                  key={emoji.id}
                  emoji={emoji}
                  selected={Boolean(
                    selectedEmoji && selectedEmoji.id === emoji.id,
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    handleEmojiClick(emoji);
                  }}
                  onKeyDown={(event) => handleEmojiKeyboardPress(event, emoji)}
                  role="listitem"
                  ref={
                    selectedEmoji?.id === emoji.id
                      ? selectedEmojiRef
                      : undefined
                  }
                  aria-controls={emojiPanelId}
                  emojiFamily={EmojiFamily[emojiFamily]}
                  scale={emojiScale}
                  selectedSkintone={skintone}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    );

    return (
      <div className="flex flex-row gap-1 relative">
        <div className="flex-1 grow">{grid}</div>

        {selectedEmoji !== null && (
          <div className="lg:w-96 bg-card p-4 fixed bottom-0 left-0 right-0 my-2 mx-2 lg:sticky lg:top-20 lg:bottom-none lg:left-none lg:my-0 rounded-2xl h-max">
            <EmojiPanel
              emoji={selectedEmoji}
              id={emojiPanelId}
              onClose={() => setSelectedEmoji(null)}
            />
          </div>
        )}
      </div>
    );
  },
);

EmojiGrid.displayName = 'EmojiGrid';
