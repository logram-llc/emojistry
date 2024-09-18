import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, it, beforeEach, expect, vi, Mock } from 'vitest';
import { AppSearch } from '@/components/AppSearch';

describe('AppSearch', () => {
  let mockSetQuery: Mock;

  beforeEach(() => {
    mockSetQuery = vi.fn();
  });

  test.each([
    { keyCombo: '{Control>}{f}{/Control}' },
    { keyCombo: '{Control>}{a}{/Control}' },
  ])(
    '[component] should focus the input when `$keyCombo` is pressed',
    async ({ keyCombo }: { keyCombo: string }) => {
      // Arrange
      render(<AppSearch setQuery={mockSetQuery} query="" />);

      // Act
      await userEvent.keyboard(keyCombo);

      // Assert
      const searchInput = screen.getByRole('search');
      expect(searchInput).toHaveFocus();
    },
  );

  it('[component] should open the search popover when the input is clicked', async () => {
    // Arrange
    render(<AppSearch setQuery={mockSetQuery} query="" />);

    // Act
    const searchInput = screen.getByRole('search');
    await userEvent.click(searchInput);

    // Assert
    const searchPopover = screen.getByRole('listbox', {
      hidden: true,
    });
    expect(searchPopover).toBeVisible();
  });
});
