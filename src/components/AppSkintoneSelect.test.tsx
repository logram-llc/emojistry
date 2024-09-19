import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock, test } from 'vitest';
import userEvent from '@testing-library/user-event';
import { AppSkintoneSelect } from '@/components/AppSkintoneSelect';
import { EmojiSkintone } from '@/lib/emojis/EmojiTypes';
import { useEmojiGridSettings } from '@/providers/EmojiGridSettingsProvider';

vi.mock('@/providers/EmojiGridSettingsProvider', () => ({
  useEmojiGridSettings: vi.fn(),
}));

describe('AppSkintoneSelect', () => {
  let mockSetSettings: Mock;

  beforeEach(() => {
    mockSetSettings = vi.fn();
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
  });

  it('[component] should open popover on trigger click', async () => {
    // Act
    render(<AppSkintoneSelect />);
    await userEvent.click(screen.getByRole('button'));

    // Assert
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  test.each(
    Object.values(EmojiSkintone).map((skintone) => ({
      skintone,
    })),
  )(
    '[component] should render a button for skintone $skintone',
    async ({ skintone }: { skintone: EmojiSkintone }) => {
      // Act
      render(<AppSkintoneSelect />);
      await userEvent.click(screen.getByRole('button'));

      // Assert
      expect(
        screen.getByRole('button', {
          name: new RegExp(`Switch to skintone '${skintone}'$`, 'i'),
        }),
      ).toBeInTheDocument();
    },
  );

  it('[component] should render trigger based on `settings.skintone`', async () => {
    // Arrange
    const selectedSkintone = EmojiSkintone.MEDIUM_DARK;
    (useEmojiGridSettings as Mock<typeof useEmojiGridSettings>).mockReturnValue(
      {
        settings: {
          showEmojiGroups: false,
          emojiSize: 64,
          skintone: selectedSkintone,
          emojiGap: 1,
        },
        setSettings: mockSetSettings,
      },
    );

    // Act
    render(<AppSkintoneSelect />);

    // Assert
    expect(
      screen.getByRole('button', {
        name: new RegExp(`Selected skintone '${selectedSkintone}'$`, 'i'),
      }),
    ).toBeInTheDocument();
  });

  it('[component] should invoke setSettings on skintone button click', async () => {
    // Arrange
    const toSelectSkintone = EmojiSkintone.MEDIUM;

    // Act
    render(<AppSkintoneSelect />);
    await userEvent.click(screen.getByRole('button'));

    await userEvent.click(
      screen.getByRole('button', {
        name: new RegExp(`Switch to skintone '${toSelectSkintone}'$`, 'i'),
      }),
    );

    // Assert
    expect(mockSetSettings).toBeCalled();

    const setSettingsCallback = mockSetSettings.mock.calls[0][0];
    expect(setSettingsCallback().skintone).toStrictEqual(toSelectSkintone);
  });

  test.each([{ keypress: '{Enter}' }, { keypress: '{Space}' }])(
    '[component] should invoke setSettings on skintone button click',
    async ({ keypress }: { keypress: string }) => {
      // Arrange
      const toSelectSkintone = EmojiSkintone.MEDIUM;

      // Act
      render(<AppSkintoneSelect />);
      await userEvent.click(screen.getByRole('button'));

      await userEvent.type(
        screen.getByRole('button', {
          name: new RegExp(`Switch to skintone '${toSelectSkintone}'$`, 'i'),
        }),
        keypress,
      );

      // Assert
      expect(mockSetSettings).toBeCalled();

      const setSettingsCallback = mockSetSettings.mock.calls[0][0];
      expect(setSettingsCallback().skintone).toStrictEqual(toSelectSkintone);
    },
  );
});
