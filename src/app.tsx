import { useState, useEffect, useMemo } from 'react';
import { EmojiGrid } from '@/components/AppGrid';
import { AppHeader } from '@/components/AppHeader';
import { AppSearch } from '@/components/AppSearch';
import { TooltipProvider } from '@/components/ui/tooltip';
import { EmojiIndexer } from '@/lib/search/EmojiIndexer';
import './reset.css';
import './utilities.css';
import './global.css';
import { EmojiSearchEngine } from '@/lib/search/EmojiSearchEngine';
import { ThemeProvider } from '@/providers/ThemeProvider';
import { EmojiMetadataReader } from './lib/emojis/EmojiMetadataReader';
import { QueryParserError } from '@/lib/search/QueryParser';
import { useEmojiFamily } from './providers/EmojiFamilyProvider';
import {
  IEmojiSortComparator,
  groupAlphabeticSortComparator,
} from '@/lib/SortUtils';
import { EmojiFamily, IEmoji } from './lib/emojis/EmojiTypes';
import { EmojiIndexReader } from '@/lib/emojis/EmojiIndexReader';
import { useEmojiGridSettings } from '@/providers/EmojiGridSettingsProvider';
import { UrlManager } from '@/lib/UrlManager';
import { SeoManager } from '@/lib/SeoManager';

const EMOJI_SEARCH_INDEX = new EmojiIndexReader();
const EMOJI_REPOSITORY = new EmojiMetadataReader();
const URL_MANAGER = new UrlManager(EMOJI_REPOSITORY);
const SEO_MANAGER = new SeoManager();

function App() {
  const [query, setQuery] = useState('');
  const [emojiSearchEngine, setEmojiSearchEngine] =
    useState<EmojiSearchEngine | null>(null);
  const [emojis, setEmojis] = useState<IEmoji[]>([]);
  const [sortComparator, setSortComparator] =
    useState<IEmojiSortComparator | null>(null);
  const { emojiFamily } = useEmojiFamily();
  const { settings } = useEmojiGridSettings();

  useEffect(() => {
    (async () => {
      const emojiIndexer = EmojiIndexer.fromIndex(
        await EMOJI_SEARCH_INDEX.read(EmojiFamily[emojiFamily]),
      );
      setEmojiSearchEngine(new EmojiSearchEngine(emojiIndexer));

      const allEmojis = Object.values(
        await EMOJI_REPOSITORY.all(EmojiFamily[emojiFamily]),
      );
      setEmojis(allEmojis);
    })();
  }, [emojiFamily]);

  useEffect(() => {
    (async () => {
      if (query && emojiSearchEngine !== null) {
        try {
          const searchedEmojis = await emojiSearchEngine.search(
            query,
            EmojiFamily[emojiFamily],
          );
          setEmojis(searchedEmojis);
        } catch (error) {
          if (error instanceof QueryParserError) {
            //syntaxError = error.message;
          } else {
            throw error;
          }
        }
      } else {
        const allEmojis = Object.values(
          await EMOJI_REPOSITORY.all(EmojiFamily[emojiFamily]),
        );
        setEmojis(allEmojis);
      }
    })();
  }, [query, emojiSearchEngine, emojiFamily]);

  const sortedEmojis = useMemo(() => {
    if (sortComparator !== null) {
      return settings.showEmojiGroups
        ? emojis.sort(sortComparator).sort(groupAlphabeticSortComparator)
        : emojis.sort(sortComparator);
    }

    return settings.showEmojiGroups
      ? emojis.sort(groupAlphabeticSortComparator)
      : emojis;
  }, [emojis, sortComparator, settings.showEmojiGroups]);

  return (
    <>
      <ThemeProvider>
        <TooltipProvider delayDuration={600}>
          <div id="app-container">
            <AppHeader id="app-header" setSortComparator={setSortComparator}>
              <AppSearch setQuery={setQuery} query={query} />
            </AppHeader>
            <EmojiGrid
              emojis={Object.values(sortedEmojis)}
              urlManager={URL_MANAGER}
              seoManager={SEO_MANAGER}
            />
          </div>
        </TooltipProvider>
      </ThemeProvider>
    </>
  );
}

export default App;
