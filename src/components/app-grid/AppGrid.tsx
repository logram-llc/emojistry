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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from '@/components/ui/sheet';

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

function generateCells({
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

  const cells: EmojiGridCellType[] = [];

  Object.entries(groupedEmojis).forEach(([group, emojis]) => {
    cells.push(createGroupLabelCell(group));

    const remainingInRow = columnCount - 1;

    cells.push(...new Array(remainingInRow).fill(createEmptyCell()));

    let remainingSpots = columnCount;

    cells.push(
      ...emojis.map((emoji) => {
        remainingSpots--;

        if (remainingSpots === 0) {
          remainingSpots = columnCount;
        }

        return createEmojiCell(emoji);
      }),
    );

    if (remainingSpots > 0 && remainingSpots !== columnCount) {
      cells.push(...new Array(remainingSpots).fill(createEmptyCell()));
    }
  });

  return cells;
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
      <AutoSizer key={emojiSize} className="overflow-hidden">
        {({ height, width }) => {
          const columnCount = Math.floor(
            width / ((EMOJI_SIZE_IN_SPRITESHEET + EMOJI_GRID_GAP) * emojiScale),
          );

          const cells = generateCells({
            emojis,
            groupedEmojis,
            showEmojiGroups,
            columnCount,
          });

          const defaultGridProps = {
            itemData: {
              emojiCells: cells,
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
            rowCount: Math.ceil(cells.length / columnCount),
          };

          return showEmojiGroups ? (
            <VariableSizeGrid<IEmojiGridCellData>
              {...defaultGridProps}
              columnWidth={() =>
                Math.floor(
                  (EMOJI_SIZE_IN_SPRITESHEET + EMOJI_GRID_GAP) * emojiScale,
                )
              }
              rowHeight={(rowIndex) => {
                const item = cells[rowIndex];

                return item.type === 'group-label'
                  ? 30
                  : (EMOJI_SIZE_IN_SPRITESHEET + EMOJI_GRID_GAP) * emojiScale;
              }}
              className="!overflow-x-hidden scrollbar-thin"
            >
              {EmojiGridCell}
            </VariableSizeGrid>
          ) : (
            <FixedSizeGrid<IEmojiGridCellData>
              {...defaultGridProps}
              columnWidth={Math.floor(
                (EMOJI_SIZE_IN_SPRITESHEET + EMOJI_GRID_GAP) * emojiScale,
              )}
              rowHeight={
                (EMOJI_SIZE_IN_SPRITESHEET + EMOJI_GRID_GAP) * emojiScale
              }
              className="!overflow-x-hidden scrollbar-thin"
            >
              {EmojiGridCell}
            </FixedSizeGrid>
          );
        }}
      </AutoSizer>
    );

    return (
      <div
        className="flex flex-row grow relative"
        onKeyDown={(e) => {
          if (e.key === 'Escape') {
            setEmojiPanelOpen(false);
          }
        }}
      >
        <div className={'grow'}>{grid}</div>

        <Sheet open={emojiPanelOpen}>
          <SheetContent
            className="shadow-2xl shadow-black bg-card border-t-0"
            side="bottom"
            hideClose
            overlay={false}
          >
            <SheetTitle className="sr-only">Emoji</SheetTitle>
            <SheetDescription className="sr-only">
              Currently selected emoji
            </SheetDescription>

            <div className="mx-auto max-w-7xl my-4">
              {selectedEmoji !== null && (
                <EmojiPanel
                  emoji={selectedEmoji}
                  id={emojiPanelId}
                  onClose={() => {
                    setEmojiPanelOpen(false);
                    setTimeout(() => setSelectedEmoji(null), 300);
                  }}
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    );
  },
);

EmojiGrid.displayName = 'EmojiGrid';
