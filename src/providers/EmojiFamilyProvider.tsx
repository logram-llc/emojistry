import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useMemo,
} from 'react';
import { EmojiFamily } from '@/lib/emojis/EmojiTypes';
import { UrlManager } from '@/lib/UrlManager';
import { SeoManager } from '@/lib/SeoManager';

const DEFAULT_EMOJI_FAMILY: keyof typeof EmojiFamily = 'FLUENT_UI';

interface EmojiFamilyState {
  emojiFamily: keyof typeof EmojiFamily;
  setEmojiFamily: (family: keyof typeof EmojiFamily) => void;
}

const EmojiFamilyContext = createContext<EmojiFamilyState>({
  emojiFamily: DEFAULT_EMOJI_FAMILY,
  setEmojiFamily: () => null,
});

type EmojiFamilyProviderProps = {
  children: ReactNode;
  storageKey?: string;
};

function EmojiFamilyProvider({
  children,
  storageKey = 'emojistry-emoji-family',
}: EmojiFamilyProviderProps) {
  const [family, _setFamily] = useState<keyof typeof EmojiFamily>(() => {
    const storedFamily = localStorage.getItem(
      storageKey,
    ) as keyof typeof EmojiFamily;

    return storedFamily ? storedFamily : DEFAULT_EMOJI_FAMILY;
  });

  useEffect(() => {
    new UrlManager().setFamily(family);
    new SeoManager().setFamily(family);
  }, [family]);

  const setFamily = (family: keyof typeof EmojiFamily) => {
    localStorage.setItem(storageKey, family);
    _setFamily(family);
  };

  const value = useMemo(
    () => ({
      emojiFamily: family,
      setEmojiFamily: setFamily,
    }),
    [family],
  );

  return (
    <EmojiFamilyContext.Provider value={value}>
      {children}
    </EmojiFamilyContext.Provider>
  );
}

const useEmojiFamily = () => {
  const context = useContext(EmojiFamilyContext);

  if (context === undefined) {
    throw new Error('useEmojiFamily must be used within a EmojiFamilyProvider');
  }

  return context;
};

export { EmojiFamilyContext, EmojiFamilyProvider, useEmojiFamily };
