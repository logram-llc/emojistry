import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, Mock } from 'vitest';
import userEvent from '@testing-library/user-event';
import { within } from '@testing-library/react';
import { AppSort } from '@/components/AppSort';
import { IEmojiSortComparator, deltaE94SortComparator } from '@/lib/SortUtils';
import React from 'react';

describe('AppSort', () => {
  let mockSetSortComparator: Mock<
    React.Dispatch<React.SetStateAction<IEmojiSortComparator | null>>
  >;

  beforeEach(() => {
    mockSetSortComparator = vi.fn();
  });

  it('[component] should render the select component with the default value', () => {
    // Act
    render(<AppSort setSortComparator={mockSetSortComparator} />);

    // Assert
    const sortTrigger = screen.getByRole('combobox');
    expect(sortTrigger).toHaveTextContent('Default');
  });

  it('[component] should have dropdown values for all sort comparators', async () => {
    // Act
    render(<AppSort setSortComparator={mockSetSortComparator} />);
    const sortTrigger = screen.getByRole('combobox');
    await userEvent.click(sortTrigger);

    // Assert
    const dropdown = screen.getByRole('listbox');
    expect(within(dropdown).getByText('Default')).toBeInTheDocument();
    expect(
      within(dropdown).getByText('Color (Delta CIE94)'),
    ).toBeInTheDocument();
  });

  it("[component] should switch to 'Color (Delta CIE94)'", async () => {
    // Act
    render(<AppSort setSortComparator={mockSetSortComparator} />);
    const sortTrigger = screen.getByRole('combobox');
    await userEvent.click(sortTrigger);

    const dropdown = screen.getByRole('listbox');
    const colorDropdownValue = within(dropdown).getByText(
      'Color (Delta CIE94)',
    );
    await userEvent.click(colorDropdownValue);

    // Assert
    expect(mockSetSortComparator).toHaveBeenCalledOnce();

    // NOTE(nicholas-ramsey): This should be an anonymous function that returns the sortComparator function.
    // Due to how setState works with React when dealing with functions as values.
    const passedSortComparatorFunction = mockSetSortComparator.mock
      .calls[0][0] as () => IEmojiSortComparator;
    const passedSortComparator = passedSortComparatorFunction();

    expect(passedSortComparator).toBe(deltaE94SortComparator);
  });
});
