import { EmojiSkintone } from '@/lib/emojis/EmojiTypes';
import { createContext, useContext, useState, ReactNode, useMemo } from 'react';

export type EmojiGridSettings = {
  emojiGap: number;
  emojiSize: 64 | 56 | 40;
  showEmojiGroups: boolean;
  skintone: EmojiSkintone;
};

type EmojiGridSettingsProviderProps = {
  children: ReactNode;
  storageKey?: string;
};

const initialState: EmojiGridSettings = {
  emojiGap: 0,
  emojiSize: 64,
  showEmojiGroups: true,
  skintone: EmojiSkintone.DEFAULT,
};

interface EmojiGridSettingsState {
  settings: EmojiGridSettings;
  setSettings: (settings: EmojiGridSettings) => void;
}

const EmojiGridSettingsContext = createContext<EmojiGridSettingsState>({
  settings: initialState,
  setSettings: () => null,
});

function EmojiGridSettingsProvider({
  children,
  storageKey = 'emojistry-grid-settings',
}: EmojiGridSettingsProviderProps) {
  const [settings, _setSettings] = useState<EmojiGridSettings>(() => {
    const storedValue = localStorage.getItem(storageKey);
    if (!storedValue) {
      return initialState;
    }
    return { ...initialState, ...JSON.parse(storedValue) } as EmojiGridSettings;
  });

  const setSettings = (settings: EmojiGridSettings) => {
    localStorage.setItem(storageKey, JSON.stringify(settings));
    _setSettings(settings);
  };

  const value = useMemo(() => ({ settings, setSettings }), [settings]);

  return (
    <EmojiGridSettingsContext.Provider value={value}>
      {children}
    </EmojiGridSettingsContext.Provider>
  );
}

const useEmojiGridSettings = () => {
  const context = useContext(EmojiGridSettingsContext);

  if (context === undefined) {
    throw new Error(
      'useEmojiGridSettings must be used within a EmojiGridSettingsProvider',
    );
  }

  return context;
};

export {
  EmojiGridSettingsContext,
  EmojiGridSettingsProvider,
  useEmojiGridSettings,
};
