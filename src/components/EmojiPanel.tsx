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
}>) {
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
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center overflow-hidden gap-1 mr-2">
          <h2 className="truncate text-foreground text-lg font-bold">
            {emoji.tts}
          </h2>

          <TooltipOnClick
            message="Copied URL!"
            onSuccess={() =>
              copyTextToClipboard(
                new URL(
                  UrlManager.getEmojiPath(emoji),
                  window.location.href,
                ).toString(),
              )
            }
          >
            <Button
              variant="ghost"
              size="xs"
              className="group flex"
              aria-label="Copy emoji URL"
            >
              <Share2 className="size-5 min-w-5" />
            </Button>
          </TooltipOnClick>
        </div>

        <Button
          variant="ghost"
          size="xs"
          aria-label="Close panel"
          onClick={onClose}
        >
          <X className="size-5 min-w-5" />
        </Button>
      </div>

      <div className="bg-muted/50 rounded-3xl py-4 flex items-center justify-center relative">
        <img className="size-28 sm:size-48" src={emojiStyle.url}></img>

        <div className="absolute right-0 top-0 bottom-0 flex flex-col justify-center mr-3 gap-1">
          {emojiStyle.colorPalette.map((color) => (
            <TooltipOnClick
              message="Copied hex!"
              onSuccess={() => copyTextToClipboard(color.hex)}
              key={color.hex}
            >
              <Button
                variant="ghost"
                size="icon"
                className="size-6 min-w-6 rounded-full ring ring-muted ring-2 -mt-2"
                style={{
                  backgroundColor: color.hex,
                }}
                aria-label={`Copy color ${color.hex}`}
              >
                <data className="uppercase sr-only">{color.hex}</data>
              </Button>
            </TooltipOnClick>
          ))}
        </div>
      </div>

      <div>
        {Object.keys(emoji.styles).length > 1 && (
          <div className="my-2">
            <span className="sr-only">Variants</span>
            <ul className="flex flex-nowrap overflow-x-auto snap-mandatory pb-2 snap-x gap-1.5">
              {Object.values(emoji.styles).map((style) => (
                <li key={style.group + style.id}>
                  <Button
                    size="icon"
                    variant="secondary"
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

        <div className="flex gap-2 my-2">
          <Button
            size="sm"
            variant="secondary"
            aria-label="Download emoji"
            onClick={handleDownloadClick}
          >
            <Download className="size-4 min-w-4 mr-2" />
            {emojiStyle.isSvg ? 'SVG' : 'PNG'}
          </Button>

          <TooltipOnClick message="Copied!" onSuccess={handleCopyClick}>
            <Button
              variant="secondary"
              size="sm"
              aria-label="Copy emoji to clipboard"
            >
              <Copy className="size-4 min-w-4 mr-2" />
              {emojiStyle.isSvg ? 'SVG' : 'PNG'}
            </Button>
          </TooltipOnClick>
        </div>

        <div className="inline-flex flex-wrap items-center mt-1">
          <span className="inline-flex items-center leading-5">
            <Tag className="inline size-4 min-w-4 mr-2" /> {emoji.group}
          </span>
          <span className="mx-1">&mdash;</span>
          <ul className="inline-flex gap-1 flex-wrap">
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
        </div>
      </div>
    </section>
  );
}

export { EmojiPanel };
