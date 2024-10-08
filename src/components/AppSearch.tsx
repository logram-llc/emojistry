import React, {
  HTMLProps,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Input } from '@/components/ui/input';

import { cn } from '@/lib/utils';
import { ValidFilterName } from '../Search/EmojiSearchEngine';
import { Button } from './ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Search } from 'lucide-react';

type AppSearchProps = {
  setQuery: React.Dispatch<React.SetStateAction<string>>;
  query: string;
} & Omit<HTMLProps<HTMLInputElement>, 'children'>;

function isAlphaKeyEvent(e: KeyboardEvent): boolean {
  const isAlpha =
    !e.metaKey &&
    !e.altKey &&
    !e.ctrlKey &&
    e.key.length === 1 &&
    /[a-zA-Z]/.test(e.key);
  return isAlpha;
}

const filterKeywords: Record<ValidFilterName, React.ReactNode> = {
  keyword: <>Include only results matching the specified keyword</>,
  family: <>Include only results from the given family</>,
  group: <>Include only results within the specified group</>,
  style: <>Include only results matching the specified style</>,
  id: <>Include only results matching the specified ID</>,
  color: (
    <>Include results similar to the specified color (#000000 or rgb(0,0,0))</>
  ),
};

const operators: Record<string, React.ReactNode> = {
  '|': <>(OR) matches the left or right side</>,
  '&': <>(AND) matches both the left and right side</>,
  '!': <>(NEGATE) excludes the matching emojis from the result</>,
};

const AppSearch = ({
  setQuery,
  query,
  className,
  ...props
}: AppSearchProps): React.ReactNode => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [pendingFilter, setPendingFilter] = useState<string | null>(null);
  const [pendingOperator, setPendingOperator] = useState<string | null>(null);
  const [searchInFocus, setSearchInFocus] = useState<boolean>(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDropdownId = 'search-dropdown';

  useEffect(() => {
    const handleKeydown = (e: KeyboardEvent) => {
      if (searchInFocus) {
        return true;
      }

      const isCtrlCombo = e.ctrlKey && ['f', 'a'].includes(e.key);
      const isAlpha = isAlphaKeyEvent(e);
      const isCtrlF = e.ctrlKey && e.key === 'f';

      if (isAlpha || isCtrlCombo || e.key === 'Backspace') {
        searchInputRef.current?.focus();

        // TODO(nicholas-ramsey): This initial key click is consumed, but it needs to be appended to the query.
      }
      if (isCtrlF) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeydown);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
    };
  }, [searchInFocus]);

  const handleSearchFocus = useCallback(() => {
    setSearchInFocus(true);
  }, []);

  const handleSearchBlur = useCallback(() => {
    setSearchInFocus(false);
  }, []);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      setDropdownOpen(open);
    },
    [searchInFocus],
  );

  useEffect(() => {
    if (pendingFilter === null) {
      return;
    }

    setPendingFilter(null);
    searchInputRef.current?.focus();
    searchInputRef.current?.setSelectionRange(
      query.length - 1,
      query.length - 1,
    );
  }, [query, pendingFilter]);

  const handleFilterAddition = (filterKeyword: string) => {
    setPendingFilter(filterKeyword);
    setQuery(`${query} ${filterKeyword}:""`);
  };

  useEffect(() => {
    if (pendingOperator === null) {
      return;
    }

    setPendingOperator(null);
    searchInputRef.current?.focus();
    searchInputRef.current?.setSelectionRange(query.length, query.length);
  }, [query, pendingOperator]);

  const handleOperatorAddition = (operator: string) => {
    setPendingOperator(operator);
    setQuery(`${query} ${operator} `);
  };

  return (
    <Popover open={dropdownOpen} onOpenChange={handleOpenChange}>
      <div className={cn('flex h-full relative min-w-60 flex-1', className)}>
        <PopoverTrigger className="h-full" asChild>
          <Input
            id="search-input"
            ref={searchInputRef}
            type="text"
            icon={<Search className="size-4 min-w-4" />}
            placeholder="Search"
            value={query}
            className={cn(
              dropdownOpen && 'rounded-b-none',
              dropdownOpen && 'ring-1',
              'relative transition-all duration-100 ease-in-out w-full font-bold lg:max-w-[40rem]',
            )}
            onChange={(event) => setQuery(event.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            aria-controls={searchDropdownId}
            aria-expanded={dropdownOpen}
            aria-haspopup="listbox"
            aria-label="Search"
            autoCapitalize="false"
            autoCorrect="false"
            spellCheck="false"
            role="search"
            {...props}
          />
        </PopoverTrigger>

        <PopoverContent
          id={searchDropdownId}
          role="listbox"
          className={cn(
            dropdownOpen && 'rounded-br-md rounded-bl-md',
            'w-[var(--radix-popover-trigger-width)] border-l-0 border-r-0 border-b-0 rounded-bl-none rounded-t-none rounded-br-none px-1 text-white origin-[var(--radix-popover-content-transform-origin)] transition',
          )}
          aria-labelledby="search-input"
          align="start"
          sideOffset={0}
          onPointerDownOutside={() => setDropdownOpen(false)}
        >
          <ul>
            {Object.entries(filterKeywords).map(
              ([filterKeyword, labelNode]) => (
                <li key={filterKeyword} className="text-foreground">
                  <Button
                    variant="ghost"
                    className="w-full flex justify-start h-auto items-start"
                    onClick={() => handleFilterAddition(filterKeyword)}
                  >
                    <span className="text-purple-500 dark:text-purple-300 font-mono">
                      {filterKeyword}:
                    </span>
                    <span className="ml-2 font-mono text-wrap text-left">
                      {labelNode}
                    </span>
                  </Button>
                </li>
              ),
            )}
            {Object.entries(operators).map(([operator, labelNode]) => (
              <li key={operator} className="text-foreground">
                <Button
                  variant="ghost"
                  className="w-full flex justify-start h-auto items-start"
                  onClick={() => handleOperatorAddition(operator)}
                >
                  <span className="text-blue-500 dark:text-blue-300 font-mono">
                    {operator}
                  </span>
                  <span className="ml-2 font-mono text-wrap text-left">
                    {labelNode}
                  </span>
                </Button>
              </li>
            ))}
          </ul>
        </PopoverContent>
      </div>
    </Popover>
  );
};

export { AppSearch };
