import React from 'react';
import {
  Select,
  SelectContent,
  SelectTrigger,
  SelectItem,
  SelectValue,
} from '@/components/ui/select';
import {
  IEmojiSortComparator,
  deltaE94SortComparator,
  cldrSortComparator,
} from '@/lib/SortUtils';
import { ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

type AppSortProps = {
  setSortComparator: React.Dispatch<
    React.SetStateAction<IEmojiSortComparator | null>
  >;
  className?: string;
};

type SortMethodologies = Record<
  string,
  { label: string; comparator: IEmojiSortComparator }
>;

const sortMethologies: SortMethodologies = {
  default: {
    label: 'Default',
    comparator: cldrSortComparator,
  },
  deltaE94: {
    label: 'Color (Delta CIE94)',
    comparator: deltaE94SortComparator,
  },
};

const AppSort = ({
  setSortComparator,
  className,
}: AppSortProps): React.ReactNode => {
  return (
    <Select
      onValueChange={(value) =>
        setSortComparator(() => sortMethologies[value].comparator)
      }
      defaultValue="default"
    >
      <SelectTrigger
        className={cn('text-left', className)}
        aria-label="Sort emojis"
      >
        <ArrowUpDown className="size-4 mr-2" />
        <SelectValue placeholder="Sort..." />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(sortMethologies).map(
          ([sortMethodologyKey, sortMethodology]) => (
            <SelectItem value={sortMethodologyKey} key={sortMethodologyKey}>
              {sortMethodology.label}
            </SelectItem>
          ),
        )}
      </SelectContent>
    </Select>
  );
};

export { AppSort };
