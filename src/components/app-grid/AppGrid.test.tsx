import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  Mock,
  Mocked,
  test,
} from 'vitest';
import { EmojiGrid } from '@/components/app-grid/AppGrid';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  IEmoji,
  IEmojiStyle,
  EmojiFamily,
  EmojiSkintone,
} from '@/lib/emojis/EmojiTypes';
import {
  EmojiGridSettings,
  useEmojiGridSettings,
} from '@/providers/EmojiGridSettingsProvider';
import { useEmojiFamily } from '@/providers/EmojiFamilyProvider';
import { UrlManager } from '@/lib/UrlManager';
import { SeoManager } from '@/lib/SeoManager';

const DEFAULT_STYLE: Omit<IEmojiStyle, 'colorPalette'> = {
  id: 'default',
  label: 'Default Emoji Style',
  url: '/emoji.png',
  group: 'Standard',
  isSvg: true,
  height: 32,
  width: 32,
  x: 2,
  y: 2,
};

const ALTERNATIVE_STYLE: Omit<IEmojiStyle, 'colorPalette'> = {
  id: 'alt',
  label: 'Alt Emoji Style',
  url: '/emoji.png',
  group: 'Alternative',
  isSvg: false,
  height: 32,
  width: 32,
  x: 3,
  y: 3,
};

const EMOJI_FIXTURES: IEmoji[] = [
  {
    id: 'emoji1',
    cldr: 'grinning face',
    group: 'Smileys & Emotion',
    keywords: ['face', 'smile', 'happy'],
    tts: 'grinning face',
    family: EmojiFamily.FLUENT_UI.toString(),
    familyVersion: '1.0',
    glyph: '😀',
    styles: {
      default: {
        ...DEFAULT_STYLE,
        colorPalette: [
          {
            hex: '#000000',
            rgb: [0, 0, 0],
            hsl: [0, 0, 0],
            CIELAB: [0, 0, 0],
            occurrences: 1,
          },
        ],
      },
    },
    defaultStyle: 'default',
  },
  {
    id: 'emoji2',
    cldr: 'shuffle_tracks',
    group: 'Symbols',
    keywords: ['fruit', 'apple'],
    tts: 'shuffle tracks',
    family: EmojiFamily.FLUENT_UI.toString(),
    familyVersion: '1.0',
    glyph: '🔀',
    styles: {
      alt: {
        ...ALTERNATIVE_STYLE,
        colorPalette: [
          {
            hex: '#333333',
            rgb: [51, 51, 51],
            hsl: [0, 0, 20],
            CIELAB: [21.2, 0, 0],
            occurrences: 1,
          },
        ],
      },
    },
    defaultStyle: 'alt',
  },
];

vi.mock('@/providers/EmojiGridSettingsProvider', () => ({
  useEmojiGridSettings: vi.fn(),
}));

vi.mock('@/providers/EmojiFamilyProvider', () => ({
  useEmojiFamily: vi.fn(),
}));

describe('EmojiGrid', () => {
  let mockUrlManager: Partial<Mocked<UrlManager>>;
  let mockSeoManager: Partial<Mocked<SeoManager>>;

  beforeEach(() => {
    mockUrlManager = {
      getEmoji: vi.fn().mockResolvedValue(EMOJI_FIXTURES[0]),
      setEmoji: vi.fn(),
    };

    vi.spyOn(UrlManager, 'getEmojiPath').mockImplementation(
      (emoji) => `/${emoji.family}/${emoji.id}`,
    );

    mockSeoManager = {
      setEmoji: vi.fn(),
    };

    (useEmojiGridSettings as Mock<typeof useEmojiGridSettings>).mockReturnValue(
      {
        settings: {
          showEmojiGroups: false,
          emojiSize: 64,
          skintone: EmojiSkintone.DEFAULT,
          emojiGap: 1,
        },
        setSettings: vi.fn(),
      },
    );
    (useEmojiFamily as Mock<typeof useEmojiFamily>).mockReturnValue({
      emojiFamily: EmojiFamily.FLUENT_UI,
      setEmojiFamily: vi.fn(),
    });
  });

  const renderComponentWithProviders = (component: React.ReactNode) => {
    return render(<TooltipProvider>{component}</TooltipProvider>);
  };

  it('[component] should render the emoji grid with provided emojis', () => {
    // Act
    renderComponentWithProviders(
      <EmojiGrid
        emojis={EMOJI_FIXTURES}
        urlManager={mockUrlManager as unknown as UrlManager}
        seoManager={mockSeoManager as unknown as SeoManager}
      />,
    );

    // Assert
    expect(screen.getByRole('tablist')).toBeInTheDocument();

    for (const emoji of EMOJI_FIXTURES) {
      expect(
        screen.getByRole('tab', {
          name: new RegExp(emoji.tts, 'i'),
        }),
      ).toBeInTheDocument();
    }
  });

  it('[component] should open the EmojiPanel when an emoji is clicked', async () => {
    // Act
    renderComponentWithProviders(
      <EmojiGrid
        emojis={EMOJI_FIXTURES}
        urlManager={mockUrlManager as unknown as UrlManager}
        seoManager={mockSeoManager as unknown as SeoManager}
      />,
    );

    // Assert
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    const emoji = screen.getByRole('tab', {
      name: new RegExp(EMOJI_FIXTURES[0].tts, 'i'),
    });
    await userEvent.click(emoji);

    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('[component] should close the EmojiPanel when the EmojiPanel close button is clicked', async () => {
    // Act
    renderComponentWithProviders(
      <EmojiGrid
        emojis={EMOJI_FIXTURES}
        urlManager={mockUrlManager as unknown as UrlManager}
        seoManager={mockSeoManager as unknown as SeoManager}
      />,
    );

    // Assert
    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
    const emoji = screen.getByRole('tab', {
      name: new RegExp(EMOJI_FIXTURES[0].tts, 'i'),
    });
    await userEvent.click(emoji);

    const emojiPanel = screen.getByRole('tabpanel');

    expect(emojiPanel).toBeInTheDocument();

    const closeButton = within(emojiPanel).getByRole('button', {
      name: /close panel/i,
    });
    await userEvent.click(closeButton);

    expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
  });

  test.each([{ keypress: '{Enter}' }, { keypress: '{Space}' }])(
    '[component] should open the EmojiPanel when an emoji is focused and $keypress is pressed',
    async ({ keypress }: { keypress: string }) => {
      // Act
      renderComponentWithProviders(
        <EmojiGrid
          emojis={EMOJI_FIXTURES}
          urlManager={mockUrlManager as unknown as UrlManager}
          seoManager={mockSeoManager as unknown as SeoManager}
        />,
      );

      // Assert
      expect(screen.queryByRole('tabpanel')).not.toBeInTheDocument();
      const emoji = screen.getByRole('tab', {
        name: new RegExp(EMOJI_FIXTURES[0].tts, 'i'),
      });
      await userEvent.type(emoji, keypress);

      expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    },
  );

  it('[component] should display grouped emojis when showEmojiGroups setting is enabled', () => {
    // Arrange
    (useEmojiGridSettings as Mock<typeof useEmojiGridSettings>).mockReturnValue(
      {
        settings: {
          showEmojiGroups: true,
          emojiSize: 64,
          skintone: EmojiSkintone.DEFAULT,
          emojiGap: 1,
        },
        setSettings: vi.fn(),
      },
    );

    // Act
    renderComponentWithProviders(
      <EmojiGrid
        emojis={EMOJI_FIXTURES}
        urlManager={mockUrlManager as unknown as UrlManager}
        seoManager={mockSeoManager as unknown as SeoManager}
      />,
    );

    // Assert
    for (const emoji of EMOJI_FIXTURES) {
      expect(screen.getByText(emoji.group)).toBeInTheDocument();
    }
  });

  it('[component] should support tab navigation to next emoji even after closing EmojiPanel', async () => {
    // Act
    renderComponentWithProviders(
      <EmojiGrid
        emojis={EMOJI_FIXTURES}
        urlManager={mockUrlManager as unknown as UrlManager}
        seoManager={mockSeoManager as unknown as SeoManager}
      />,
    );

    const emojiA = screen.getByRole('tab', {
      name: new RegExp(EMOJI_FIXTURES[0].tts, 'i'),
    });
    await userEvent.click(emojiA);

    // Assert
    const emojiPanel = screen.getByRole('tabpanel');

    expect(emojiPanel).toBeInTheDocument();

    const closeButton = within(emojiPanel).getByRole('button', {
      name: /close panel/i,
    });
    await userEvent.click(closeButton);
    await userEvent.type(emojiA, '{tab}');

    expect(document.activeElement).toBe(
      screen.getByRole('tab', {
        name: new RegExp(EMOJI_FIXTURES[1].tts, 'i'),
      }),
    );

    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
  });

  it('[component] should update URLManager when an emoji is selected', async () => {
    // Act
    renderComponentWithProviders(
      <EmojiGrid
        emojis={EMOJI_FIXTURES}
        urlManager={mockUrlManager as unknown as UrlManager}
        seoManager={mockSeoManager as unknown as SeoManager}
      />,
    );

    const emoji = screen.getByRole('tab', {
      name: new RegExp(EMOJI_FIXTURES[0].tts, 'i'),
    });

    await userEvent.click(emoji);

    // Assert
    expect(mockUrlManager.setEmoji).toHaveBeenCalledWith(EMOJI_FIXTURES[0]);
  });

  it('[component] should update SEOManager when an emoji is selected', async () => {
    // Act
    renderComponentWithProviders(
      <EmojiGrid
        emojis={EMOJI_FIXTURES}
        urlManager={mockUrlManager as unknown as UrlManager}
        seoManager={mockSeoManager as unknown as SeoManager}
      />,
    );

    const emoji = screen.getByRole('tab', {
      name: new RegExp(EMOJI_FIXTURES[0].tts, 'i'),
    });

    await userEvent.click(emoji);

    // Assert
    expect(mockSeoManager.setEmoji).toHaveBeenCalledWith(EMOJI_FIXTURES[0]);
  });

  test.each([
    {
      emojiScale: 40 as EmojiGridSettings['emojiSize'],
      expectedStyleScale: 0.625,
    },
    {
      emojiScale: 56 as EmojiGridSettings['emojiSize'],
      expectedStyleScale: 0.875,
    },
    { emojiScale: 64 as EmojiGridSettings['emojiSize'], expectedStyleScale: 1 },
  ])(
    '[component] should scale emojis based on the emojiSize setting (scale: $emojiScale)',
    ({
      emojiScale,
      expectedStyleScale,
    }: {
      emojiScale: EmojiGridSettings['emojiSize'];
      expectedStyleScale: number;
    }) => {
      // Arrange
      (
        useEmojiGridSettings as Mock<typeof useEmojiGridSettings>
      ).mockReturnValue({
        settings: {
          showEmojiGroups: false,
          emojiSize: emojiScale,
          skintone: EmojiSkintone.DEFAULT,
          emojiGap: 1,
        },
        setSettings: vi.fn(),
      });

      // Act
      renderComponentWithProviders(
        <EmojiGrid
          emojis={EMOJI_FIXTURES}
          urlManager={mockUrlManager as unknown as UrlManager}
          seoManager={mockSeoManager as unknown as SeoManager}
        />,
      );

      // Assert
      const emoji = screen.getByRole('tab', {
        name: new RegExp(EMOJI_FIXTURES[0].tts, 'i'),
      });
      const emojiImage = emoji.firstChild as HTMLElement;
      const style = window.getComputedStyle(emojiImage);

      expect(style.transform).toContain(`scale(${expectedStyleScale})`);
    },
  );
});
