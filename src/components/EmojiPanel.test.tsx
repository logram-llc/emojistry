import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { EmojiPanel } from '@/components/EmojiPanel';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  EmojiFamily,
  IEmojiStyle,
  IEmoji,
  RGBTuple,
  HSLTuple,
  CIELABTuple,
} from '@/lib/emojis/EmojiTypes';
import { UrlManager } from '@/lib/UrlManager';
import React from 'react';

const DEFAULT_STYLE: Omit<IEmojiStyle, 'colorPalette'> = {
  id: 'default',
  label: 'Default Emoji Style',
  url: '/emoji.png',
  group: 'Standard',
  isSvg: true,
  height: 32,
  width: 32,
  x: 0,
  y: 0,
};

const ALTERNATIVE_STYLE: Omit<IEmojiStyle, 'colorPalette'> = {
  id: 'alt',
  label: 'Alt Emoji Style',
  url: '/emoji-alt.png',
  group: 'Alternative',
  isSvg: false,
  height: 32,
  width: 32,
  x: 1,
  y: 1,
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
    id: 'emoji4',
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

describe('EmojiPanel', () => {
  let mockOnClose: Mock<() => void>;
  let mockFetch: Mock;

  beforeEach(() => {
    mockOnClose = vi.fn();

    mockFetch = global.fetch = vi.fn();
  });

  const renderComponentWithProviders = (component: React.ReactNode) => {
    return render(<TooltipProvider>{component}</TooltipProvider>);
  };

  it('[component] should render the EmojiPanel with the correct emoji', () => {
    // Act
    renderComponentWithProviders(
      <EmojiPanel
        emoji={EMOJI_FIXTURES[0]}
        id="emoji-panel"
        onClose={mockOnClose}
      />,
    );

    // Assert
    expect(screen.getByRole('tabpanel')).toBeInTheDocument();
    expect(screen.getByText('grinning face')).toBeInTheDocument();
    expect(screen.getByText('Smileys & Emotion')).toBeInTheDocument();
    expect(screen.getByText('face')).toBeInTheDocument();
  });

  it('[component] should copy the emoji SVG to clipboard when copy button is clicked', async () => {
    // Arrange
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<svg>Mock SVG</svg>'),
      blob: () => Promise.resolve(new Blob()),
    });
    Object.assign(global.navigator, {
      clipboard: {
        writeText: vi.fn(),
        write: vi.fn(),
      },
    });
    global.ClipboardItem = vi.fn();

    // Act
    renderComponentWithProviders(
      <EmojiPanel
        emoji={EMOJI_FIXTURES[0]}
        id="emoji-panel"
        onClose={mockOnClose}
      />,
    );

    // Assert
    const copyButton = screen.getByRole('button', {
      name: /copy emoji to clipboard/i,
    });
    expect(copyButton).toBeInTheDocument();
    await userEvent.click(copyButton);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(navigator.clipboard.write).toHaveBeenCalledOnce();
  });

  it('[component] should copy the emoji image to clipboard when copy button is clicked', async () => {
    // Arrange
    mockFetch.mockResolvedValue({
      ok: true,
      text: () => Promise.resolve('<svg>Mock SVG</svg>'),
      blob: () => Promise.resolve(new Blob([], { type: 'image/png' })),
    });
    Object.assign(global.navigator, {
      clipboard: {
        writeText: vi.fn(),
        write: vi.fn(),
      },
    });
    global.ClipboardItem = vi.fn();

    // Act
    renderComponentWithProviders(
      <EmojiPanel
        emoji={EMOJI_FIXTURES[1]}
        id="emoji-panel"
        onClose={mockOnClose}
      />,
    );

    // Assert
    const copyButton = screen.getByRole('button', {
      name: /copy emoji to clipboard/i,
    });
    expect(copyButton).toBeInTheDocument();
    await userEvent.click(copyButton);

    expect(mockFetch).toHaveBeenCalledOnce();
    expect(navigator.clipboard.write).toHaveBeenCalledOnce();
  });

  test.each([
    {
      emoji: EMOJI_FIXTURES[0],
      expectedCopiedHex:
        EMOJI_FIXTURES[0].styles[EMOJI_FIXTURES[0].defaultStyle].colorPalette[0]
          .hex,
    },
    {
      emoji: {
        ...EMOJI_FIXTURES[0],
        styles: {
          default: {
            ...DEFAULT_STYLE,
            colorPalette: [
              {
                hex: '#FF0000',
                rgb: [255, 0, 0] as RGBTuple,
                hsl: [0, 100, 50] as HSLTuple,
                CIELAB: [53.24, 80.09, 67.2] as CIELABTuple,
                occurrences: 1,
              },
              {
                hex: '#00FF00',
                rgb: [0, 255, 0] as RGBTuple,
                hsl: [120, 100, 50] as HSLTuple,
                CIELAB: [87.73, -86.18, 83.18] as CIELABTuple,
                occurrences: 1,
              },
            ],
          },
        },
      },
      expectedCopiedHex: '#FF0000',
    },
  ])(
    '[component] should copy the color hex to clipboard when color button is clicked',
    async ({
      emoji,
      expectedCopiedHex,
    }: {
      emoji: IEmoji;
      expectedCopiedHex: string;
    }) => {
      // Arrange
      Object.assign(global.navigator, {
        clipboard: {
          writeText: vi.fn(),
        },
      });

      // Act
      renderComponentWithProviders(
        <EmojiPanel emoji={emoji} id="emoji-panel" onClose={mockOnClose} />,
      );

      // Assert
      const colorButton = screen.getByRole('button', {
        name: new RegExp(`copy color ${expectedCopiedHex}`, 'i'),
      });
      expect(colorButton).toBeInTheDocument();

      await userEvent.click(colorButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expectedCopiedHex,
      );
    },
  );

  it('[component] should copy the emoji URL to clipboard when copy URL button is clicked', async () => {
    // Arrange
    Object.assign(global.navigator, {
      clipboard: {
        writeText: vi.fn(),
      },
      canShare: vi.fn(() => false),
    });

    const emoji = EMOJI_FIXTURES[0];
    const expectedUrl = new URL(
      UrlManager.getEmojiPath(emoji),
      window.location.href,
    ).toString();

    // Act
    renderComponentWithProviders(
      <EmojiPanel emoji={emoji} id="emoji-panel" onClose={mockOnClose} />,
    );

    // Assert
    const copyUrlButton = screen.getByTestId('mobile-share-url');
    expect(copyUrlButton).toBeInTheDocument();

    await userEvent.click(copyUrlButton);

    expect(navigator.clipboard.writeText).toHaveBeenCalledOnce();
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(expectedUrl);
  });

  it('[component] should change the emoji style when a different style is selected', async () => {
    // Arrange
    const emoji = {
      ...EMOJI_FIXTURES[0],
      styles: {
        default: {
          ...DEFAULT_STYLE,
          colorPalette: [
            {
              hex: '#000000',
              rgb: [0, 0, 0] as RGBTuple,
              hsl: [0, 0, 0] as HSLTuple,
              CIELAB: [0, 0, 0] as CIELABTuple,
              occurrences: 1,
            },
          ],
        },
        alt: {
          ...ALTERNATIVE_STYLE,
          colorPalette: [
            {
              hex: '#333333',
              rgb: [51, 51, 51] as RGBTuple,
              hsl: [0, 0, 20] as HSLTuple,
              CIELAB: [21.2, 0, 0] as CIELABTuple,
              occurrences: 1,
            },
          ],
        },
      },
    };

    // Act
    renderComponentWithProviders(
      <EmojiPanel emoji={emoji} id="emoji-panel" onClose={mockOnClose} />,
    );

    // Assert
    const styleButtons = screen.getAllByRole('button', {
      name: /view emoji style/i,
    });
    expect(styleButtons.length).toBe(Object.values(emoji.styles).length);

    await userEvent.click(styleButtons[1]);

    const displayedImage = screen.getByRole('img', {
      name: new RegExp(`emoji style ${ALTERNATIVE_STYLE.label}`, 'i'),
    });
    expect(displayedImage).toHaveAttribute('src', ALTERNATIVE_STYLE.url);
  });
});
