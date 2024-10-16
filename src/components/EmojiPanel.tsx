import {
  PropsWithChildren,
  ReactNode,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { IEmoji, IEmojiStyle } from '@/lib/emojis/EmojiTypes';
import { Button } from './ui/button';
import { Copy, Download, Share2, Tag, X } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { UrlManager } from '@/lib/UrlManager';
import { useEmojiGridSettings } from '@/providers/EmojiGridSettingsProvider';
import { cn } from '@/lib/utils';

/**
 * Copies the given text to the clipboard.
 * @param text - The text to be copied.
 */
function copyTextToClipboard(text: string): Promise<void> {
  return navigator.clipboard.writeText(text);
}

function getFilenameFromPath(path: string): string {
  const normalizedPath = path.replace(/\\/g, '/');

  const filename = normalizedPath.substring(
    normalizedPath.lastIndexOf('/') + 1,
  );

  return filename;
}

function initiateDownload(downloadUrl: string, fileName: string) {
  const a = document.createElement('a');
  a.href = downloadUrl;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

interface EmojiPanelProps {
  emoji: IEmoji;
  id: string;
  onClose: () => void;
}

function TooltipOnClick({
  message,
  delay = 1200,
  onSuccess,
  children,
}: PropsWithChildren<{
  message: string;
  delay?: number;
  onSuccess?: () => Promise<void> | void;
}>): React.ReactElement {
  const [open, setOpen] = useState<boolean>(false);

  const handleClick = useCallback(async () => {
    if (onSuccess) {
      try {
        await onSuccess();
        setOpen(true);
        setTimeout(() => setOpen(false), delay);
      } catch (error) {
        console.error('Action failed:', error);
      }
    }
  }, [onSuccess, delay]);

  return (
    <Tooltip open={open}>
      <TooltipTrigger asChild onClick={handleClick}>
        {children}
      </TooltipTrigger>
      <TooltipContent>{message}</TooltipContent>
    </Tooltip>
  );
}

function ShareAction({
  isMobile,
  onClick,
  ariaLabel,
}: {
  isMobile: boolean;
  onClick: () => void;
  ariaLabel: string;
}): React.ReactElement {
  return (
    <TooltipOnClick message="Copied URL!" onSuccess={onClick}>
      {/* TODO(nicholas-ramsey): Clean this module/component up. I don't like using `data-testid` */}
      <Button
        size="icon-sm"
        variant="ghost-dark"
        className={cn(
          isMobile ? 'flex lg:hidden' : 'hidden lg:flex',
          'rounded-full',
        )}
        aria-label={ariaLabel}
        data-testid={isMobile ? 'mobile-share-url' : 'desktop-share-url'}
      >
        <Share2 className="size-4 min-w-4" />
      </Button>
    </TooltipOnClick>
  );
}

function ButtonGroup({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactNode;
}) {
  return (
    <div
      className={'inline-flex items-center bg-muted p-0.5 h-11 rounded-full'}
    >
      <span className="mr-2.5 ml-4 text-xs font-semibold">{label}</span>

      <div className="bg-popover rounded-full">{children}</div>
    </div>
  );
}

function ShareButton({ emoji }: { emoji: IEmoji }): React.ReactElement {
  const emojiUrl = new URL(
    UrlManager.getEmojiPath(emoji),
    window.location.href,
  ).toString();
  const handleCopy = () => copyTextToClipboard(emojiUrl);

  const title = `${emoji.tts} emoji`;
  const sharePayload = { url: emojiUrl, title };
  const canShare = navigator.canShare?.(sharePayload);
  const handleShare = () => navigator.share(sharePayload);

  return (
    <>
      {/* Desktop share */}
      <ShareAction
        isMobile={false}
        onClick={handleCopy}
        ariaLabel="Copy emoji URL"
        data-testid="desktop-share-url"
      />

      {/* Mobile share */}
      <ShareAction
        isMobile={true}
        onClick={canShare ? handleShare : handleCopy}
        ariaLabel={canShare ? 'Share emoji URL' : 'Copy emoji URL'}
        data-testid="mobile-share-url"
      />
    </>
  );
}

function EmojiPanel({ emoji, id, onClose }: EmojiPanelProps): ReactNode {
  const [emojiStyle, setEmojiStyle] = useState<IEmojiStyle>(
    emoji.styles[emoji.defaultStyle],
  );
  const { settings } = useEmojiGridSettings();

  useEffect(() => {
    const skintoneStyle =
      Object.values(emoji.styles).find(
        (style) => style.group === settings.skintone,
      ) ?? emoji.styles[emoji.defaultStyle];

    setEmojiStyle(skintoneStyle);
  }, [emoji.id, settings.skintone]);

  const handleCopyClick = useCallback(async () => {
    const mimeType = emojiStyle.isSvg ? 'text/plain' : 'image/png';
    await navigator.clipboard.write([
      new ClipboardItem({
        [mimeType]: fetch(emojiStyle.url).then((res) => res.blob()),
      }),
    ]);
  }, [emojiStyle.id]);

  const handleDownloadClick = useCallback(() => {
    initiateDownload(emojiStyle.url, getFilenameFromPath(emojiStyle.url));
  }, [emojiStyle.id]);

  return (
    <section className="flex flex-col" role="tabpanel" id={id}>
      <header className="pb-2 border-b border-muted">
        <div className="flex justify-between items-center">
          <div className="flex items-center overflow-hidden gap-2 mr-2">
            <h2 className="truncate text-foreground text-lg font-bold">
              {emoji.tts}
            </h2>

            <span className="inline-flex items-center leading-5 h-8 bg-muted px-2.5 text-sm font-semibold rounded-full">
              <Tag className="inline size-4 min-w-4 mr-1 opacity-60" />{' '}
              {emoji.group}
            </span>

            <ShareButton emoji={emoji} />
          </div>

          <Button
            variant="ghost-dark"
            size="icon-sm"
            className="rounded-full"
            aria-label="Close panel"
            onClick={onClose}
          >
            <X className="size-5 min-w-5" />
          </Button>
        </div>

        <ul className="mt-1 text-sm inline-flex gap-1 flex-wrap">
          {emoji.keywords.map((keyword) => (
            <li key={keyword} className="leading-5">
              {keyword}
              <span className="select-none font-bold"> &middot;</span>
            </li>
          ))}
          <li className="leading-5">
            <span>{emoji.glyph}</span>
          </li>
        </ul>
      </header>

      <div className="flex flex-col lg:flex-row">
        <section className="lg:max-w-[20rem] lg:min-w-[20rem] pt-4 border-b lg:border-b-0 lg:pb-0 lg:pr-4 lg:border-r border-muted">
          <div className="bg-muted/50 rounded-3xl py-4 flex items-center justify-center relative">
            <img className="size-28 sm:size-48" src={emojiStyle.url}></img>
          </div>

          {Object.keys(emoji.styles).length > 1 && (
            <div className="my-2">
              <span className="sr-only">Variants</span>
              <ul className="flex flex-nowrap overflow-x-auto scrollbar-thin snap-mandatory pb-2 snap-x gap-1.5">
                {Object.values(emoji.styles).map((style) => (
                  <li key={style.group + style.id}>
                    <Button
                      size="icon"
                      variant="ghost-dark"
                      className="p-6 snap-start"
                      onClick={() => setEmojiStyle(style)}
                      aria-label={`View emoji style ${style.group} ${style.label}`}
                    >
                      <img
                        className="size-10 min-w-10"
                        src={style.url}
                        aria-label={`Emoji style ${style.label}`}
                      ></img>
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div className="pt-4 lg:pl-4">
          <section className="mb-4">
            <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
              Dominant Colors
            </span>

            <div className="mt-1.5 flex gap-1">
              {emojiStyle.colorPalette.map((color) => (
                <TooltipOnClick
                  message="Copied hex!"
                  onSuccess={() => copyTextToClipboard(color.hex)}
                  key={color.hex}
                >
                  <Button
                    variant="ghost-dark"
                    className="rounded-full flex items-center gap-2 p-0.5 px-4 h-11 font-semibold text-xs"
                    aria-label={`Copy color ${color.hex}`}
                  >
                    <div
                      className="size-6 min-w-6 rounded-full"
                      style={{
                        backgroundColor: color.hex,
                      }}
                    >
                      <data className="uppercase sr-only">{color.hex}</data>
                    </div>

                    <data className="uppercase">{color.hex}</data>
                  </Button>
                </TooltipOnClick>
              ))}
            </div>
          </section>

          <section>
            <span className="text-gray-800 dark:text-gray-200 font-semibold text-sm">
              Copy/Download
            </span>

            <div className="mt-1.5">
              <ButtonGroup label={emojiStyle.isSvg ? 'SVG' : 'PNG'}>
                <Button
                  size="icon"
                  variant="ghost-bright"
                  aria-label="Download emoji"
                  className="rounded-full"
                  onClick={handleDownloadClick}
                >
                  <Download className="size-4 min-w-4" />
                </Button>

                <TooltipOnClick message="Copied!" onSuccess={handleCopyClick}>
                  <Button
                    variant="ghost-bright"
                    size="icon"
                    className="rounded-full"
                    aria-label="Copy emoji to clipboard"
                  >
                    <Copy className="size-4 min-w-4" />
                  </Button>
                </TooltipOnClick>
              </ButtonGroup>
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

export { EmojiPanel };
