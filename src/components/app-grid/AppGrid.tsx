import {
  useCallback,
  useState,
  useRef,
  useEffect,
  KeyboardEvent,
  useMemo,
  RefObject,
  memo,
} from 'react';
import {
  VariableSizeGrid,
  FixedSizeGrid,
  GridChildComponentProps,
  areEqual,
} from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { useEmojiGridSettings } from '@/providers/EmojiGridSettingsProvider';
import { EmojiFamily, EmojiSkintone, IEmoji } from '@/lib/emojis/EmojiTypes';
import { EmojiPanel } from '@/components/EmojiPanel';
import { useEmojiFamily } from '@/providers/EmojiFamilyProvider';
import { SeoManager } from '@/lib/SeoManager';
import { UrlManager } from '@/lib/UrlManager';
import { Emoji } from '@/components/app-grid/Emoji';
import {
  EMOJI_GRID_GAP,
  EMOJI_SIZE_IN_SPRITESHEET,
} from '@/components/app-grid/constants';

interface IEmojiCell {
  type: 'emoji';
  content: IEmoji;
}

interface IEmptyCell {
  type: 'empty';
}

interface IGroupLabelCell {
  type: 'group-label';
  content: string;
}

type EmojiGridCellType = IEmojiCell | IEmptyCell | IGroupLabelCell;

interface IEmojiGridCellData {
  emojiCells: EmojiGridCellType[];
  selectedEmoji: IEmoji | null;
  selectedEmojiRef: RefObject<HTMLAnchorElement> | null;
  emojiPanelId: string;
  emojiScale: number;
  emojiFamily: keyof typeof EmojiFamily;
  skintone: EmojiSkintone;
  columnCount: number;
  handleEmojiClick: (emoji: IEmoji) => void;
  handleEmojiKeyboardPress: (
    event: KeyboardEvent<HTMLAnchorElement>,
    emoji: IEmoji,
  ) => void;
}

const EmojiGridCell = memo(
  ({
    data: {
      emojiCells,
      selectedEmoji,
      selectedEmojiRef,
      emojiPanelId,
      emojiScale,
      emojiFamily,
      skintone,
      columnCount,
      handleEmojiClick,
      handleEmojiKeyboardPress,
    },
    columnIndex,
    rowIndex,
    style,
  }: GridChildComponentProps<IEmojiGridCellData>) => {
    const index = rowIndex * columnCount + columnIndex;
    const item = emojiCells[index];
    const showEmptyCell =
      !item || item.type === 'empty' || index >= emojiCells.length;

    if (showEmptyCell) {
      return null;
    }

    if (item.type === 'group-label') {
      return (
        <h2
          className="text-sm tracking-wide ml-1 pb-1 inline-flex items-end text-nowrap"
          style={{
            ...style,
          }}
        >
          {item.content}
        </h2>
      );
    }

    const emoji = item.content;

    return (
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
        style={{
          ...style,
          top:
            typeof style.top === 'number'
              ? style.top + EMOJI_GRID_GAP * emojiScale
              : style.top,
          left:
            typeof style.left === 'number'
              ? style.left + EMOJI_GRID_GAP * emojiScale
              : style.left,
          width:
            typeof style.width === 'number'
              ? style.width - EMOJI_GRID_GAP * emojiScale
              : style.width,
          height:
            typeof style.height === 'number'
              ? style.height - EMOJI_GRID_GAP * emojiScale
              : style.height,
        }}
      />
    );
  },
  areEqual,
);

EmojiGridCell.displayName = 'EmojiGridCell';

function createEmojiCell(emoji: IEmoji): IEmojiCell {
  return {
    type: 'emoji',
    content: emoji,
  };
}

function createGroupLabelCell(group: string): IGroupLabelCell {
  return {
    type: 'group-label',
    content: group,
  };
}

function createEmptyCell(): IEmptyCell {
  return {
    type: 'empty',
  };
}

function generateEmojiCells({
  emojis,
  groupedEmojis,
  showEmojiGroups,
  columnCount,
}: {
  emojis: IEmoji[];
  groupedEmojis: Record<string, IEmoji[]>;
  showEmojiGroups: boolean;
  columnCount: number;
}): EmojiGridCellType[] {
  if (!showEmojiGroups) {
    return emojis.map(createEmojiCell);
  }

  const emojiCells: EmojiGridCellType[] = [];

  Object.entries(groupedEmojis).forEach(([group, emojis]) => {
    emojiCells.push(createGroupLabelCell(group));

    const remainingInRow = columnCount - 1;

    emojiCells.push(...new Array(remainingInRow).fill(createEmptyCell()));

    let remainingSpots = columnCount;

    emojiCells.push(
      ...emojis.map((emoji) => {
        remainingSpots--;

        if (remainingSpots === 0) {
          remainingSpots = columnCount;
        }

        return createEmojiCell(emoji);
      }),
    );

    if (remainingSpots > 0 && remainingSpots !== columnCount) {
      emojiCells.push(...new Array(remainingSpots).fill(createEmptyCell()));
    }
  });

  return emojiCells;
}

interface EmojiGridProps {
  emojis: IEmoji[];
  urlManager: UrlManager;
  seoManager: SeoManager;
}

export const EmojiGrid = memo<EmojiGridProps>(
  ({ emojis, urlManager, seoManager }) => {
    const {
      settings: { showEmojiGroups, emojiSize, skintone },
    } = useEmojiGridSettings();
    const emojiPanelId = 'EmojiPanel';

    // TODO: Consolidate selectedEmoji to testable hook or something
    const [selectedEmoji, setSelectedEmoji] = useState<IEmoji | null>(null);
    const [emojiPanelOpen, setEmojiPanelOpen] = useState<boolean>(false);
    const selectedEmojiRef = useRef<HTMLAnchorElement | null>(null);
    const gridRef = useRef<HTMLDivElement | null>(null);
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

    useEffect(() => {
      if (gridRef.current) {
        gridRef.current.setAttribute('role', 'tablist');
      }
    }, [gridRef.current]);

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

    const groupedEmojis = useMemo(() => {
      const groups: Record<string, IEmoji[]> = {};

      for (const emoji of emojis) {
        if (!Object.hasOwn(groups, emoji.group)) {
          groups[emoji.group] = [];
        }
        groups[emoji.group].push(emoji);
      }

      return groups;
    }, [emojis]);

    const grid = (
      <div className="overflow-hidden mt-3 h-[92vh]">
        <AutoSizer key={emojiSize}>
          {({ height, width }) => {
            const columnCount = Math.floor(
              width /
                ((EMOJI_SIZE_IN_SPRITESHEET + EMOJI_GRID_GAP * emojiScale) *
                  emojiScale),
            );

            const emojiCells = generateEmojiCells({
              emojis,
              groupedEmojis,
              showEmojiGroups,
              columnCount,
            });

            const defaultGridProps = {
              itemData: {
                emojiCells,
                selectedEmoji,
                selectedEmojiRef,
                emojiPanelId,
                emojiScale,
                emojiFamily,
                skintone,
                handleEmojiClick,
                handleEmojiKeyboardPress,
                columnCount,
              },
              overscanRowCount: 5,
              innerRef: gridRef,
              width,
              height,
              columnCount,
              rowCount: Math.ceil(emojiCells.length / columnCount),
            };

            return showEmojiGroups ? (
              <VariableSizeGrid<IEmojiGridCellData>
                {...defaultGridProps}
                columnWidth={() =>
                  (EMOJI_SIZE_IN_SPRITESHEET + EMOJI_GRID_GAP * emojiScale) *
                  emojiScale
                }
                rowHeight={(rowIndex) => {
                  const item = emojiCells[rowIndex];

                  return item.type === 'group-label'
                    ? 30
                    : (EMOJI_SIZE_IN_SPRITESHEET +
                        EMOJI_GRID_GAP * emojiScale) *
                        emojiScale;
                }}
              >
                {EmojiGridCell}
              </VariableSizeGrid>
            ) : (
              <FixedSizeGrid<IEmojiGridCellData>
                {...defaultGridProps}
                columnWidth={
                  (EMOJI_SIZE_IN_SPRITESHEET + EMOJI_GRID_GAP * emojiScale) *
                  emojiScale
                }
                rowHeight={
                  (EMOJI_SIZE_IN_SPRITESHEET + EMOJI_GRID_GAP * emojiScale) *
                  emojiScale
                }
              >
                {EmojiGridCell}
              </FixedSizeGrid>
            );
          }}
        </AutoSizer>
      </div>
    );

    return (
      <div className="flex flex-row gap-1 relative min-h-[600px]">
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
