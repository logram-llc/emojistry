import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AppHeader } from '@/components/AppHeader';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useEmojiGridSettings } from '@/providers/EmojiGridSettingsProvider';
import { useTheme, Theme } from '@/providers/ThemeProvider';
import { EmojiGridSettings } from '@/providers/EmojiGridSettingsProvider';
import { EmojiSkintone } from '@/lib/emojis/EmojiTypes';

vi.mock('@/providers/EmojiGridSettingsProvider', () => ({
  useEmojiGridSettings: vi.fn(),
}));

vi.mock('@/providers/ThemeProvider', () => ({
  useTheme: vi.fn(),
}));

describe('AppHeader', () => {
  let mockSetSettings: Mock<
    ReturnType<typeof useEmojiGridSettings>['setSettings']
  >;
  let mockSetTheme: Mock<ReturnType<typeof useTheme>['setTheme']>;
  let mockSetSortComparator: Mock;

  beforeEach(() => {
    mockSetSettings = vi.fn();
    mockSetTheme = vi.fn();
    mockSetSortComparator = vi.fn();

    (useEmojiGridSettings as Mock<typeof useEmojiGridSettings>).mockReturnValue(
      {
        settings: {
          showEmojiGroups: false,
          emojiSize: 64,
          skintone: EmojiSkintone.DEFAULT,
          emojiGap: 1,
        },
        setSettings: mockSetSettings,
      },
    );

    (useTheme as Mock<typeof useTheme>).mockReturnValue({
      theme: 'light',
      setTheme: mockSetTheme,
    });
  });

  const renderComponentWithProviders = (component: React.ReactNode) => {
    return render(<TooltipProvider>{component}</TooltipProvider>);
  };

  it('[component] should render', () => {
    // Arrange
    renderComponentWithProviders(
      <AppHeader setSortComparator={mockSetSortComparator} />,
    );

    // Assert
    expect(
      screen.getByRole('button', {
        name: 'Group emojis',
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: /toggle \w+ theme/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Decrease emoji size',
      }),
    ).toBeInTheDocument();
  });

  test.each([
    {
      currentTheme: 'light' as Theme,
      expectedThemeAfterPress: 'dark' as Theme,
    },
    {
      currentTheme: 'dark' as Theme,
      expectedThemeAfterPress: 'light' as Theme,
    },
  ])(
    '[component] should toggle the theme from $currentTheme to $expectedThemeAfterPress',
    async ({
      currentTheme,
      expectedThemeAfterPress,
    }: {
      currentTheme: Theme;
      expectedThemeAfterPress: Theme;
    }) => {
      // Arrange / Act
      (useTheme as Mock<typeof useTheme>).mockReturnValue({
        theme: currentTheme,
        setTheme: mockSetTheme,
      });

      renderComponentWithProviders(
        <AppHeader setSortComparator={mockSetSortComparator} />,
      );

      const themeToggleButton = screen.getByRole('button', {
        name: /toggle \w+ theme/i,
      });
      await userEvent.click(themeToggleButton);

      // Assert
      expect(mockSetTheme).toHaveBeenCalledWith(expectedThemeAfterPress);
    },
  );

  it('[component] should toggle emoji grouping on press', async () => {
    // Arrange
    renderComponentWithProviders(
      <AppHeader setSortComparator={mockSetSortComparator} />,
    );

    const groupToggleButton = screen.getByRole('button', {
      name: 'Group emojis',
    });

    // Act
    await userEvent.click(groupToggleButton);

    // Assert
    expect(mockSetSettings).toHaveBeenCalledWith({
      showEmojiGroups: true,
      emojiSize: 64,
      skintone: EmojiSkintone.DEFAULT,
      emojiGap: 1,
    });
  });

  test.each([
    {
      currentSize: 64 as EmojiGridSettings['emojiSize'],
      expectedSizeAfterPress: 56 as EmojiGridSettings['emojiSize'],
    },
    {
      currentSize: 56 as EmojiGridSettings['emojiSize'],
      expectedSizeAfterPress: 40 as EmojiGridSettings['emojiSize'],
    },
    {
      currentSize: 40 as EmojiGridSettings['emojiSize'],
      expectedSizeAfterPress: 64 as EmojiGridSettings['emojiSize'],
    },
  ])(
    '[component] should change the emoji size from $currentSize to $expectedSizeAfterPress after presss',
    async ({
      currentSize,
      expectedSizeAfterPress,
    }: {
      currentSize: EmojiGridSettings['emojiSize'];
      expectedSizeAfterPress: EmojiGridSettings['emojiSize'];
    }) => {
      // Arrange / Act
      (
        useEmojiGridSettings as Mock<typeof useEmojiGridSettings>
      ).mockReturnValue({
        settings: {
          showEmojiGroups: false,
          emojiSize: currentSize,
          skintone: EmojiSkintone.DEFAULT,
          emojiGap: 1,
        },
        setSettings: mockSetSettings,
      });

      renderComponentWithProviders(
        <AppHeader setSortComparator={mockSetSortComparator} />,
      );

      const sizeButton = screen.getByRole('button', {
        name: 'Decrease emoji size',
      });

      await userEvent.click(sizeButton);

      // Assert
      expect(mockSetSettings).toHaveBeenCalledWith({
        showEmojiGroups: false,
        emojiSize: expectedSizeAfterPress,
        skintone: EmojiSkintone.DEFAULT,
        emojiGap: 1,
      });
    },
  );
});
