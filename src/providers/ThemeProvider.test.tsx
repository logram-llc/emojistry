import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ThemeProvider, useTheme } from '@/providers/ThemeProvider';
import userEvent from '@testing-library/user-event';

describe('ThemeProvider', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    mockLocalStorage = {};
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      clear: () => {
        mockLocalStorage = {};
      },
    });

    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query === '(prefers-color-scheme: light)',
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const TestComponent = () => {
    const { theme, setTheme } = useTheme();

    return (
      <div>
        <p>Current Theme: {theme}</p>
        <button onClick={() => setTheme('light')}>Set Light Theme</button>
        <button onClick={() => setTheme('dark')}>Set Dark Theme</button>
        <button onClick={() => setTheme('system')}>Set System Theme</button>
      </div>
    );
  };

  it('[component] should render with the default system theme', () => {
    // Arrange / Act
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    // Assert
    expect(screen.getByText('Current Theme: system')).toBeInTheDocument();
    // NOTE(nicholas-ramsey): light is set as the stubbed matchMedia preferred color scheme
    expect(document.documentElement.classList.contains('light')).toBe(true);
  });

  it('[component] should use the theme from localStorage if available', () => {
    // Arrange
    mockLocalStorage['emojistry-theme'] = 'dark';

    // Act
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    // Assert
    expect(screen.getByText('Current Theme: dark')).toBeInTheDocument();
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('[component] should set the theme from localStorage and update localStorage on change', async () => {
    // Arrange
    render(
      <ThemeProvider>
        <TestComponent />
      </ThemeProvider>,
    );

    const setLightButton = screen.getByText('Set Light Theme');
    const setDarkButton = screen.getByText('Set Dark Theme');

    // Act / Assert
    await userEvent.click(setLightButton);

    // NOTE(nicholas-ramsey): light is set as the stubbed matchMedia preferred color scheme
    expect(screen.getByText('Current Theme: light')).toBeInTheDocument();
    expect(mockLocalStorage['emojistry-theme']).toBe('light');
    expect(document.documentElement.classList.contains('light')).toBe(true);

    await userEvent.click(setDarkButton);

    // Assert
    expect(screen.getByText('Current Theme: dark')).toBeInTheDocument();
    expect(mockLocalStorage['emojistry-theme']).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });
});
