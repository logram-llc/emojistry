import React, { HTMLProps } from 'react';
import { Button } from '@/components/ui/button';
import {
  Moon,
  Sun,
  ArrowLeft,
  Group,
  Settings,
  AArrowDown,
} from 'lucide-react';
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

const AppHeader = ({
  children,
  setSortComparator,
  ...props
}: HTMLProps<HTMLDivElement> & {
  setSortComparator: React.Dispatch<
    React.SetStateAction<IEmojiSortComparator | null>
  >;
}): React.ReactNode => {
  const { settings, setSettings } = useEmojiGridSettings();
  const { theme, setTheme } = useTheme();
  const { isPictureInPicture } = usePictureInPicture();

  const appBack = (
    <Button asChild variant="rounded" size="sm" className="group duration-75">
      <a href="https://logram.io">
        <ArrowLeft className="size-4 min-w-4 mr-1 transition group-hover:rotate-45" />
        <span className="hidden md:inline">Back to Logram</span>
        <span className="inline md:hidden">Logram</span>
      </a>
    </Button>
  );

  const appSettings = (
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

  const desktopHeader = (
    <header
      className="hidden lg:flex items-center gap-1.5 py-1 px-1.5"
      {...props}
    >
      {!isPictureInPicture && appBack}

      {children}

      <div className="flex lg:gap-1 items-center">{appSettings}</div>
    </header>
  );

  const mobileHeader = (
    <header
      className={cn('lg:hidden flex gap-1.5 py-1 px-1.5', {
        'flex-row-reverse': isPictureInPicture,
        'flex-col': !isPictureInPicture,
      })}
      {...props}
    >
      <div className="flex justify-between items-center">
        {!isPictureInPicture && appBack}

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

            {appSettings}
          </SheetContent>
        </Sheet>
      </div>

      {children}
    </header>
  );

  return (
    <>
      {desktopHeader}
      {mobileHeader}
    </>
  );
};

export { AppHeader };
