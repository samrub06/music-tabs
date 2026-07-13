'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  SparklesIcon,
  MusicalNoteIcon,
  PlayIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  AdjustmentsHorizontalIcon,
  Squares2X2Icon,
  ListBulletIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';
import { useHideHeaderOnScroll } from '@/lib/hooks/useHideHeaderOnScroll';
import { cn } from '@/lib/utils';
import { Playlist } from '@/types';
import { getPlaylistDisplayCoverUrl } from '@/utils/playlistCover';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortField = 'name' | 'songCount' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface PlaylistsClientProps {
  playlists: Playlist[];
}

function PlaylistCard({
  playlist,
  onPlay,
  onOpen,
}: {
  playlist: Playlist;
  onPlay: (e: React.MouseEvent) => void;
  onOpen: () => void;
}) {
  const { t } = useLanguage();
  const coverUrl = getPlaylistDisplayCoverUrl(playlist);

  return (
    <div
      onClick={onOpen}
      className="group flex min-w-0 cursor-pointer flex-col gap-1.5"
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-muted">
        {coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverUrl}
            alt=""
            className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/80 to-primary">
            <MusicalNoteIcon className="h-8 w-8 text-primary-foreground/90 sm:h-9 sm:w-9" />
          </div>
        )}
        <button
          onClick={onPlay}
          aria-label={t('playlistsPage.playPlaylist')}
          className="absolute right-1.5 top-1.5 inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/90 text-primary-foreground shadow-lg transition-all hover:bg-primary sm:opacity-0 sm:group-hover:opacity-100"
        >
          <PlayIcon className="h-4 w-4 flex-shrink-0" />
        </button>
      </div>
      <h3 className="truncate text-xs font-medium text-foreground">{playlist.name}</h3>
    </div>
  );
}

function PlaylistListRow({
  playlist,
  onPlay,
  onOpen,
}: {
  playlist: Playlist;
  onPlay: (e: React.MouseEvent) => void;
  onOpen: () => void;
}) {
  const { t } = useLanguage();
  const coverUrl = getPlaylistDisplayCoverUrl(playlist);

  return (
    <li>
      <div
        role="button"
        tabIndex={0}
        onClick={onOpen}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onOpen();
          }
        }}
        className="flex cursor-pointer items-center gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50 sm:py-3"
      >
        <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-primary/10">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/80 to-primary">
              <MusicalNoteIcon className="h-5 w-5 text-primary-foreground/90" />
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-foreground">{playlist.name}</p>
          {playlist.description ? (
            <p className="truncate text-xs text-muted-foreground">{playlist.description}</p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={onPlay}
          aria-label={t('playlistsPage.playPlaylist')}
          className="ms-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary transition-colors hover:bg-primary/20"
        >
          <PlayIcon className="h-5 w-5" />
        </button>
      </div>
    </li>
  );
}

export default function PlaylistsClient({ playlists }: PlaylistsClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  useHideHeaderOnScroll(scrollContainerRef, true);

  const [localSearchValue, setLocalSearchValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isCreateSheetOpen, setIsCreateSheetOpen] = useState(false);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  useEffect(() => {
    const timer = setTimeout(() => setSearchQuery(localSearchValue), 300);
    return () => clearTimeout(timer);
  }, [localSearchValue]);

  const filteredPlaylists = useMemo(() => {
    if (!searchQuery.trim()) return playlists;
    const query = searchQuery.toLowerCase().trim();
    return playlists.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        (p.description && p.description.toLowerCase().includes(query))
    );
  }, [playlists, searchQuery]);

  const sortedPlaylists = useMemo(() => {
    return [...filteredPlaylists].sort((a, b) => {
      let aVal: string | number;
      let bVal: string | number;
      switch (sortField) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'songCount':
          aVal = (a as any).songCount ?? a.songIds?.length ?? 0;
          bVal = (b as any).songCount ?? b.songIds?.length ?? 0;
          break;
        case 'createdAt':
          aVal = new Date(a.createdAt).getTime();
          bVal = new Date(b.createdAt).getTime();
          break;
        default:
          return 0;
      }
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredPlaylists, sortField, sortDirection]);

  const handleClearSearch = () => {
    setLocalSearchValue('');
    setSearchQuery('');
  };

  const handleApplyFilters = () => setIsFilterSheetOpen(false);
  const handleClearFilters = () => {
    setSortField('name');
    setSortDirection('asc');
    setIsFilterSheetOpen(false);
  };

  const handlePlaylistClick = (playlist: Playlist) => {
    router.push(`/jams/${playlist.id}`);
  };

  const handleStartSavedPlaylist = (e: React.MouseEvent, playlist: Playlist) => {
    e.stopPropagation();
    router.push(`/jams/${playlist.id}`);
  };

  const getSongCount = (p: Playlist) => (p as Playlist & { songCount?: number }).songCount ?? p.songIds?.length ?? 0;

  return (
    <div className="flex flex-1 flex-col min-h-0 overflow-hidden bg-background p-4 sm:p-6">
      <div className={cn('relative shrink-0 pb-4', isInputFocused && 'z-30')}>
        <div className="flex items-stretch gap-2 max-lg:transition-[gap] max-lg:duration-200">
          <div
            className={cn(
              'relative min-w-0 transition-[flex] duration-200',
              isInputFocused ? 'flex-1 max-lg:flex-[1_1_100%]' : 'flex-1'
            )}
          >
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <MagnifyingGlassIcon className="h-5 w-5 text-muted-foreground" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => window.setTimeout(() => setIsInputFocused(false), 150)}
                placeholder={t('playlistsPage.searchPlaceholder')}
                className="block w-full rounded-xl border border-border bg-card py-3 pl-12 pr-12 text-base text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30 sm:py-4"
              />
              {localSearchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 flex min-h-[44px] min-w-[44px] items-center justify-center pr-4 text-muted-foreground hover:text-foreground"
                  aria-label={t('common.clear')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsFilterSheetOpen(true)}
            className={cn(
              'flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-3 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground',
              isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:p-0 max-lg:opacity-0'
            )}
            aria-label={t('playlistsPage.filters')}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5 max-lg:shrink-0" />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateSheetOpen(true)}
            className="flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl bg-primary p-3 text-primary-foreground transition-colors hover:bg-primary/90"
            aria-label={t('playlistsPage.newPlaylist')}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={() => setView((current) => (current === 'grid' ? 'list' : 'grid'))}
            className={cn(
              'flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center rounded-xl p-3 text-muted-foreground transition-all duration-200 hover:bg-muted hover:text-foreground',
              isInputFocused && 'max-lg:pointer-events-none max-lg:w-0 max-lg:min-w-0 max-lg:overflow-hidden max-lg:p-0 max-lg:opacity-0'
            )}
            title={view === 'grid' ? t('playlistsPage.listView') : t('playlistsPage.gridView')}
            aria-label={view === 'grid' ? t('playlistsPage.listView') : t('playlistsPage.gridView')}
            aria-pressed={view === 'list'}
          >
            {view === 'grid' ? (
              <ListBulletIcon className="h-5 w-5" />
            ) : (
              <Squares2X2Icon className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      <div
        ref={scrollContainerRef}
        data-main-scroll
        className="relative z-0 min-h-0 flex-1 overflow-y-auto overscroll-contain"
      >
        {playlists.length === 0 ? (
          <div className="text-center py-12">
            <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('playlistsPage.noPlaylists')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('playlistsPage.startCreating')}
            </p>
            <button
              onClick={() => setIsCreateSheetOpen(true)}
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium min-h-[44px]"
            >
              <PlusIcon className="h-5 w-5" />
              {t('playlistsPage.newPlaylist')}
            </button>
          </div>
        ) : sortedPlaylists.length === 0 ? (
          <div className="text-center py-12">
            <MusicalNoteIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">
              {t('playlistsPage.noPlaylists')}
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('playlistsPage.noPlaylistsMatch')}
            </p>
          </div>
        ) : view === 'grid' ? (
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {sortedPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                onPlay={(e) => handleStartSavedPlaylist(e, playlist)}
                onOpen={() => handlePlaylistClick(playlist)}
              />
            ))}
          </div>
        ) : (
          <ul>
            {sortedPlaylists.map((playlist) => (
              <PlaylistListRow
                key={playlist.id}
                playlist={playlist}
                onPlay={(e) => handleStartSavedPlaylist(e, playlist)}
                onOpen={() => handlePlaylistClick(playlist)}
              />
            ))}
          </ul>
        )}
      </div>

      {/* Filter sheet - bottom sheet like folders */}
      <Sheet open={isFilterSheetOpen} onOpenChange={setIsFilterSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex h-[85vh] max-h-[640px] flex-col rounded-t-[1.75rem] border-b-0 border-black/[0.06] dark:border-white/[0.08] bg-background shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)] overflow-hidden"
        >
          <div className="shrink-0 flex items-center py-1.5 -mt-1">
            <div className="flex-1" aria-hidden />
            <div className="w-14 h-1 rounded-full bg-muted-foreground/25 cursor-ns-resize touch-none shrink-0" />
            <div className="flex flex-1 justify-end">
              <SheetClose className="flex min-w-[24px] min-h-[24px] items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <XMarkIcon className="h-5 w-5" />
                <span className="sr-only">{t('common.close')}</span>
              </SheetClose>
            </div>
          </div>
          <SheetHeader className="shrink-0 px-1 pb-2">
            <SheetTitle className="text-xl font-semibold">{t('playlistsPage.filters')}</SheetTitle>
          </SheetHeader>
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-5 pb-4 px-1">
            <div className="space-y-2 py-1">
              <Label htmlFor="playlist-sort" className="text-[11px] font-medium text-muted-foreground block">
                {t('playlistsPage.sortBy')}
              </Label>
              <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                <SelectTrigger
                  id="playlist-sort"
                  className="h-11 rounded-none border-0 border-b border-border/70 bg-transparent px-0 shadow-none focus:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t('playlistsPage.name')}</SelectItem>
                  <SelectItem value="songCount">{t('playlistsPage.songCount')}</SelectItem>
                  <SelectItem value="createdAt">{t('playlistsPage.createdAt')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 py-1">
              <Label htmlFor="playlist-sort-dir" className="text-[11px] font-medium text-muted-foreground block">
                {t('songs.sortOrder')}
              </Label>
              <Select value={sortDirection} onValueChange={(v) => setSortDirection(v as SortDirection)}>
                <SelectTrigger
                  id="playlist-sort-dir"
                  className="h-11 rounded-none border-0 border-b border-border/70 bg-transparent px-0 shadow-none focus:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t('songs.ascending')}</SelectItem>
                  <SelectItem value="desc">{t('songs.descending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="shrink-0 flex flex-row gap-3 px-6 py-4 pt-4 pb-8 safe-area-inset-bottom">
            <Button variant="outline" onClick={handleClearFilters} className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial">
              {t('common.clear')}
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial">
              {t('common.apply')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Sheet open={isCreateSheetOpen} onOpenChange={setIsCreateSheetOpen}>
        <SheetContent
          side="bottom"
          showCloseButton={false}
          className="flex flex-col gap-0 rounded-t-[1.75rem] border-b-0 border-black/[0.06] bg-background p-0 dark:border-white/[0.08] shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.12)] dark:shadow-[0_-8px_32px_-8px_rgba(0,0,0,0.4)]"
        >
          <div className="shrink-0 flex items-center py-1.5 -mt-1 px-4">
            <div className="flex-1" aria-hidden />
            <div className="w-14 h-1 rounded-full bg-muted-foreground/25 cursor-ns-resize touch-none shrink-0" />
            <div className="flex flex-1 justify-end">
              <SheetClose className="flex min-w-[24px] min-h-[24px] items-center justify-center rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
                <XMarkIcon className="h-5 w-5" />
                <span className="sr-only">{t('common.close')}</span>
              </SheetClose>
            </div>
          </div>
          <SheetHeader className="shrink-0 px-6 pb-2">
            <SheetTitle className="text-xl font-semibold">{t('playlistsPage.newPlaylist')}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2 px-6 pb-8 safe-area-inset-bottom">
            <button
              type="button"
              onClick={() => {
                setIsCreateSheetOpen(false)
                router.push('/jams/new')
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-black/[0.06] p-3 text-start transition-colors hover:bg-muted/50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-900/40">
                <PlusIcon className="h-5 w-5 text-rose-600 dark:text-rose-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">
                  {t('createMenu.createPlaylist')}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t('createMenu.createPlaylistDescription')}
                </div>
              </div>
            </button>
            <button
              type="button"
              onClick={() => {
                setIsCreateSheetOpen(false)
                router.push('/jams/ai')
              }}
              className="flex w-full items-center gap-3 rounded-xl border border-black/[0.06] p-3 text-start transition-colors hover:bg-muted/50 dark:border-white/[0.08] dark:hover:bg-white/[0.04]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/40">
                <SparklesIcon className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-foreground">
                  {t('createMenu.generatePlaylistWithAI')}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t('createMenu.generatePlaylistWithAIDescription')}
                </div>
              </div>
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
