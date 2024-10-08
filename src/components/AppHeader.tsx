import React, { HTMLProps } from 'react';
import { Button } from '@/components/ui/button';
import { NotoEmojiRocket } from '@/components/icons/NotoEmojiRocket';
import { Moon, Sun, Group, Settings, AArrowDown } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEmojiGridSettings } from '@/providers/EmojiGridSettingsProvider';
import { useTheme } from '@/providers/ThemeProvider';
import { AppEmojiFamilySelect } from './AppEmojiFamilySelect';
import { AppSort } from './AppSort';
import { IEmojiSortComparator } from '@/lib/SortUtils';
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { AppSkintoneSelect } from './AppSkintoneSelect';
import { usePictureInPicture } from '@/providers/PictureInPictureProvider';
import { cn } from '@/lib/utils';

function AppLogo() {
  return (
    <div className="inline-flex justify-center items-center">
      <span className="inline-flex justify-center items-center mr-1 size-8 min-w-6 min-h-6">
        {NotoEmojiRocket}
      </span>
      <span className="inline text-lg font-bold mr-3">Emojistry</span>
    </div>
  );
}

function AppSettings({
  setSortComparator,
}: {
  setSortComparator: React.Dispatch<
    React.SetStateAction<IEmojiSortComparator | null>
  >;
}) {
  const { settings, setSettings } = useEmojiGridSettings();
  const { theme, setTheme } = useTheme();

  return (
    <>
      <AppEmojiFamilySelect className="lg:w-40" />
      <AppSort className="lg:w-32" setSortComparator={setSortComparator} />

      <div className="flex gap-1 items-center">
        <Tooltip>
          <TooltipTrigger asChild>
            <AppSkintoneSelect></AppSkintoneSelect>
          </TooltipTrigger>
          <TooltipContent>
            <p>Select the displayed skintone</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              aria-label="Group emojis"
              pressed={settings.showEmojiGroups}
              onPressedChange={(enabled) =>
                setSettings({ ...settings, showEmojiGroups: enabled })
              }
            >
              <Group className="size-4 min-w-4" />
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            {settings.showEmojiGroups && <p>Hide emoji groups</p>}
            {!settings.showEmojiGroups && <p>Show emoji groups</p>}
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              variant="ghost"
              aria-label="Decrease emoji size"
              onClick={() =>
                setSettings({
                  ...settings,
                  emojiSize:
                    settings.emojiSize === 64
                      ? 56
                      : settings.emojiSize === 56
                        ? 40
                        : 64,
                })
              }
            >
              <AArrowDown className="size-4 min-w-4 mr-2" />

              <span className="text-sm">
                {settings.emojiSize === 64 && 'Lg'}
                {settings.emojiSize === 56 && 'Md'}
                {settings.emojiSize === 40 && 'Sm'}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Decrease emoji size</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Toggle
              size="sm"
              aria-label="Toggle light theme"
              pressed={theme === 'light'}
              onPressedChange={(enabled) =>
                setTheme(enabled ? 'light' : 'dark')
              }
            >
              {theme === 'light' && <Sun className="size-4 min-w-4" />}
              {theme === 'dark' && <Moon className="size-4 min-w-4" />}
              {theme === 'system' && <Sun className="size-4 min-w-4" />}
            </Toggle>
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch to {theme === 'light' ? 'dark' : 'light'} theme</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </>
  );
}

function DesktopHeader({
  children,
  setSortComparator,
  ...props
}: HTMLProps<HTMLDivElement> & {
  setSortComparator: React.Dispatch<
    React.SetStateAction<IEmojiSortComparator | null>
  >;
}) {
  const { isPictureInPicture } = usePictureInPicture();

  return (
    <header
      className="hidden lg:flex items-center gap-1.5 py-1 px-1.5"
      {...props}
    >
      {!isPictureInPicture && <AppLogo />}

      {children}

      <div className="flex lg:gap-1 items-center">
        <AppSettings setSortComparator={setSortComparator} />
      </div>
    </header>
  );
}

function MobileHeader({
  children,
  setSortComparator,
  ...props
}: HTMLProps<HTMLDivElement> & {
  setSortComparator: React.Dispatch<
    React.SetStateAction<IEmojiSortComparator | null>
  >;
}) {
  const { isPictureInPicture } = usePictureInPicture();

  return (
    <header
      className={cn('lg:hidden flex gap-1.5 py-1 px-1.5', {
        'flex-row-reverse': isPictureInPicture,
        'flex-col': !isPictureInPicture,
      })}
      {...props}
    >
      <div className="flex justify-between items-center">
        {!isPictureInPicture && <AppLogo />}

        <Sheet>
          <SheetTrigger asChild>
            <Button size="sm" variant="ghost">
              <Settings className="size-4 min-h-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="bottom" className="flex flex-col gap-2">
            <SheetTitle>Settings</SheetTitle>
            <SheetDescription className="sr-only">
              App settings
            </SheetDescription>

            <AppSettings setSortComparator={setSortComparator} />
          </SheetContent>
        </Sheet>
      </div>

      {children}
    </header>
  );
}

const AppHeader = ({
  setSortComparator,
  ...props
}: HTMLProps<HTMLDivElement> & {
  setSortComparator: React.Dispatch<
    React.SetStateAction<IEmojiSortComparator | null>
  >;
}): React.ReactNode => {
  return (
    <>
      <DesktopHeader setSortComparator={setSortComparator} {...props} />
      <MobileHeader setSortComparator={setSortComparator} {...props} />
    </>
  );
};

export { AppHeader };
