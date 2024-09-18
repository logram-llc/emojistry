import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/react';
import { AppEmojiFamilySelect } from '@/components/AppEmojiFamilySelect';
import { useEmojiFamily } from '@/providers/EmojiFamilyProvider';
import { EmojiFamily } from '@/lib/emojis/EmojiTypes';

vi.mock('@/providers/EmojiFamilyProvider', () => ({
  useEmojiFamily: vi.fn(),
}));

describe('AppEmojiFamilySelect', () => {
  let mockSetEmojiFamily: Mock<
    React.Dispatch<React.SetStateAction<EmojiFamily>>
  >;

  beforeEach(() => {
    mockSetEmojiFamily = vi.fn();

    useEmojiFamily.mockReturnValue({
      emojiFamily: EmojiFamily.FLUENT_UI,
      setEmojiFamily: mockSetEmojiFamily,
    });
  });

  it('[component] should render the select component with the default value', () => {
    // Act
    render(<AppEmojiFamilySelect />);

    // Assert
    const familySelectTrigger = screen.getByRole('combobox');
    expect(familySelectTrigger).toHaveTextContent('Fluent Emoji');
  });

  it('[component] should have dropdown values for all emoji families', async () => {
    // Act
    render(<AppEmojiFamilySelect />);
    const familySelectTrigger = screen.getByRole('combobox');
    await userEvent.click(familySelectTrigger);

    // Assert
    const dropdown = screen.getByRole('listbox');
    expect(within(dropdown).getByText('Fluent Emoji')).toBeInTheDocument();
    expect(within(dropdown).getByText('Noto (Google)')).toBeInTheDocument();
  });

  it("[component] should switch to 'Noto (Google)' on dropdown value click", async () => {
    // Act
    render(<AppEmojiFamilySelect />);
    const familySelectTrigger = screen.getByRole('combobox');
    await userEvent.click(familySelectTrigger);

    const dropdown = screen.getByRole('listbox');
    const notoDropdownValue = within(dropdown).getByText('Noto (Google)');
    await userEvent.click(notoDropdownValue);

    // Assert
    expect(mockSetEmojiFamily).toHaveBeenCalledWith(
      EmojiFamily.NOTO.toString(),
    );
  });
});
