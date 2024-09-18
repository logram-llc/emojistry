import { forwardRef, KeyboardEvent, useCallback } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { useEmojiGridSettings } from '@/providers/EmojiGridSettingsProvider';
import { Button } from './ui/button';
import { EmojiSkintone } from '@/lib/emojis/EmojiTypes';
import { Popover } from './ui/popover';
import { cn } from '@/lib/utils';
import { PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const SKINTONE_CLASSES: Record<EmojiSkintone, string> = {
  [EmojiSkintone.DEFAULT]: 'bg-gradient-to-r from-[#ffca28] to-[#ffbf14]',
  [EmojiSkintone.LIGHT]: 'bg-gradient-to-r from-[#f5dab9] to-[#fbd2a0]',
  [EmojiSkintone.MEDIUM_LIGHT]: 'bg-gradient-to-r from-[#e0ba94] to-[#cea67c]',
  [EmojiSkintone.MEDIUM]: 'bg-gradient-to-r from-[#b98c68] to-[#a77d63]',
  [EmojiSkintone.MEDIUM_DARK]: 'bg-gradient-to-r from-[#a56c43] to-[#905939]',
  [EmojiSkintone.DARK]: 'bg-gradient-to-r from-[#6f5249] to-[#5e4138]',
};

const SKINTONE_ORDER = [
  EmojiSkintone.DEFAULT,
  EmojiSkintone.LIGHT,
  EmojiSkintone.MEDIUM_LIGHT,
  EmojiSkintone.MEDIUM,
  EmojiSkintone.MEDIUM_DARK,
  EmojiSkintone.DARK,
];

const appSkintoneColorVariants = cva(
  'size-5 min-w-5 rounded-full transition shadow-sm',
  {
    variants: {
      variant: {
        default: '',
        ring: 'ring-accent ring-4',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

interface AppSkintoneColorProps
  extends VariantProps<typeof appSkintoneColorVariants> {
  skintone: EmojiSkintone;
  ['aria-describedby']?: string;
  ['aria-label']?: string;
}

function AppSkintoneColor({
  skintone,
  variant,
  'aria-describedby': ariaDescribedBy,
  'aria-label': ariaLabel,
}: AppSkintoneColorProps) {
  return (
    <div
      className={cn(
        SKINTONE_CLASSES[skintone],
        appSkintoneColorVariants({ variant }),
      )}
      aria-describedby={ariaDescribedBy}
      aria-label={ariaLabel}
      key={skintone}
    ></div>
  );
}

const AppSkintoneSelect = forwardRef<HTMLButtonElement>((_, ref) => {
  const { settings, setSettings } = useEmojiGridSettings();
  const skintoneDropdownId = 'skintone-dropdown';

  const handleSkintoneChange = useCallback((skintone: EmojiSkintone) => {
    setSettings({ ...settings, skintone: skintone });
  }, []);

  const handleKeyboardPress = useCallback(
    (event: KeyboardEvent, skintone: EmojiSkintone) => {
      if (![' ', 'Enter'].includes(event.key)) {
        return;
      }

      handleSkintoneChange(skintone);
    },
    [],
  );

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          ref={ref}
          variant={'ghost'}
          size="icon"
          className="rounded-full"
          aria-controls={skintoneDropdownId}
          aria-haspopup="listbox"
        >
          <AppSkintoneColor
            skintone={settings.skintone}
            aria-label={`Selected skintone '${settings.skintone}'`}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        id={skintoneDropdownId}
        role="listbox"
        align="center"
        sideOffset={3}
        className="border-l-0 border-r-0 border-b-0 rounded-bl-none rounded-t-none rounded-br-none px-1 text-white origin-[var(--radix-popover-content-transform-origin)] transition"
      >
        <ul className="flex justify-between gap-1">
          {SKINTONE_ORDER.map((skintone) => (
            <li key={skintone}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-full"
                onClick={() => handleSkintoneChange(skintone)}
                onKeyDown={(event: KeyboardEvent) =>
                  handleKeyboardPress(event, skintone)
                }
                aria-label={`Switch to skintone '${skintone}'`}
              >
                <AppSkintoneColor
                  skintone={skintone}
                  aria-describedby={skintone}
                  variant={skintone === settings.skintone ? 'ring' : 'default'}
                />
                <span className="sr-only" id={skintone}>
                  {skintone.replace('-', ' ')}
                </span>
              </Button>
            </li>
          ))}
        </ul>
      </PopoverContent>
    </Popover>
  );
});

AppSkintoneSelect.displayName = 'AppSkintoneSelect';

export { AppSkintoneSelect };
