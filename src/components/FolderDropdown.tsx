'use client';

import { Folder } from '@/types';
import { useLanguage } from '@/context/LanguageContext';
import { FolderIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const UNORGANIZED_VALUE = '__unorganized__';

interface FolderDropdownProps {
  currentFolderId?: string;
  folders: Folder[];
  onFolderChange: (folderId: string | undefined) => Promise<void>;
  disabled?: boolean;
  /** Larger tap target and text on mobile (song page, etc.) */
  size?: 'compact' | 'comfortable';
  fullWidth?: boolean;
}

const triggerSizeClasses = {
  compact:
    'h-auto min-h-0 w-auto max-w-[10rem] gap-1.5 px-2.5 py-0.5 text-xs [&_svg]:h-3 [&_svg]:w-3',
  comfortable:
    'h-auto min-h-0 w-auto max-w-[min(12rem,70vw)] gap-1.5 px-2.5 py-1 text-xs [&_svg]:h-3.5 [&_svg]:w-3.5 sm:max-w-[10rem] sm:gap-1.5 sm:px-2.5 sm:py-0.5 sm:text-xs sm:[&_svg]:h-3 sm:[&_svg]:w-3',
} as const;

export default function FolderDropdown({
  currentFolderId,
  folders,
  onFolderChange,
  disabled = false,
  size = 'compact',
  fullWidth = false,
}: FolderDropdownProps) {
  const { t } = useLanguage();
  const [isLoading, setIsLoading] = useState(false);

  const selectValue = currentFolderId ?? UNORGANIZED_VALUE;

  const handleValueChange = (value: string) => {
    if (disabled || isLoading) return;

    const folderId = value === UNORGANIZED_VALUE ? undefined : value;
    if (folderId === currentFolderId || (folderId === undefined && !currentFolderId)) {
      return;
    }

    setIsLoading(true);
    void onFolderChange(folderId)
      .catch((error) => {
        console.error('Error changing folder:', error);
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  return (
    <div
      className={cn('min-w-0', fullWidth && 'w-full')}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <Select
        value={selectValue}
        onValueChange={handleValueChange}
        disabled={disabled || isLoading}
      >
        <SelectTrigger
          className={cn(
            'rounded-full border-0 bg-muted font-medium text-foreground shadow-none',
            'hover:bg-primary/10 hover:text-primary focus:ring-1 focus:ring-primary/25',
            'disabled:cursor-not-allowed disabled:opacity-50',
            triggerSizeClasses[size],
            fullWidth && 'w-full max-w-none justify-between'
          )}
          aria-label={t('songs.folder')}
        >
          <FolderIcon className="shrink-0 opacity-80" aria-hidden />
          <SelectValue placeholder={isLoading ? '...' : t('songs.unorganized')} />
        </SelectTrigger>
        <SelectContent
          position="popper"
          className="max-h-[min(16rem,var(--radix-select-content-available-height))]"
        >
          <SelectItem
            value={UNORGANIZED_VALUE}
            className="py-2.5 pl-8 text-sm sm:py-1.5"
          >
            {t('songs.unorganized')}
          </SelectItem>
          {folders.map((folder) => (
            <SelectItem
              key={folder.id}
              value={folder.id}
              className="py-2.5 pl-8 text-sm sm:py-1.5"
            >
              {folder.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
