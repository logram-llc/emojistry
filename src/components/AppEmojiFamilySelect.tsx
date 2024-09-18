import React from 'react';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import { useEmojiFamily } from '@/providers/EmojiFamilyProvider';
import { FluentEmojiRocket } from '@/components/icons/FluentEmojiRocket';
import { NotoEmojiRocket } from '@/components/icons/NotoEmojiRocket';
import { EmojiFamily } from '@/lib/emojis/EmojiTypes';
import { cn } from '@/lib/utils';

const EmojiFamilies = {
  [EmojiFamily.FLUENT_UI]: {
    label: 'Fluent Emoji',
    icon: FluentEmojiRocket,
    value: 'FLUENT_UI' as keyof typeof EmojiFamily,
  },
  [EmojiFamily.NOTO]: {
    label: 'Noto (Google)',
    icon: NotoEmojiRocket,
    value: 'NOTO' as keyof typeof EmojiFamily,
  },
};

function AppEmojiFamilySelect({
  className,
}: {
  className?: string;
}): React.ReactNode {
  const { emojiFamily, setEmojiFamily } = useEmojiFamily();

  return (
    <Select
      value={emojiFamily}
      onValueChange={(value) =>
        setEmojiFamily(value as keyof typeof EmojiFamily)
      }
      defaultValue={EmojiFamily.FLUENT_UI}
    >
      <SelectTrigger
        className={cn('text-left', className)}
        aria-label="Select emoji family"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(EmojiFamilies).map(([familyKey, familyMeta]) => (
          <SelectItem value={familyKey} key={familyKey}>
            <span className="flex items-center whitespace-nowrap gap-1.5">
              <span className="inline-flex justify-center items-center size-4 min-w-4 min-h-4">
                {familyMeta.icon}
              </span>
              <span>{familyMeta.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export { AppEmojiFamilySelect };
