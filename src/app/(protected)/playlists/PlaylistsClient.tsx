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
  TableCellsIcon,
  PlusIcon,
} from '@heroicons/react/24/outline';
import { useLanguage } from '@/context/LanguageContext';
import { Song, Playlist } from '@/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SortField = 'name' | 'songCount' | 'createdAt';
type SortDirection = 'asc' | 'desc';

interface PlaylistsClientProps {
  songs: Song[];
  playlists: Playlist[];
}

function PlaylistCard({
  playlist,
  songCount,
  onPlay,
  onOpen,
}: {
  playlist: Playlist;
  songCount: number;
  onPlay: (e: React.MouseEvent) => void;
  onOpen: () => void;
}) {
  const { t } = useLanguage();
  return (
    <div
      onClick={onOpen}
      className="w-full min-w-0 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
    >
      <div className="p-3 sm:p-4">
        <div className="flex-1 min-w-0 mb-2">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 dark:text-gray-100 truncate">
            {playlist.name}
          </h3>
          {playlist.description && (
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-0.5 line-clamp-2">
              {playlist.description}
            </p>
          )}
        </div>
        <div className="flex items-center justify-between text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1">
            <MusicalNoteIcon className="h-3.5 w-3.5 flex-shrink-0" />
            {songCount} {songCount === 1 ? t('songs.songCount') : t('songs.songCountPlural')}
          </span>
          <span>
            {new Date(playlist.createdAt).toLocaleDateString(undefined, {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
        <button
          onClick={onPlay}
          aria-label={t('playlistsPage.playPlaylist')}
          className="mt-3 w-full inline-flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <PlayIcon className="h-6 w-6 flex-shrink-0" />
        </button>
      </div>
    </div>
  );
}

export default function PlaylistsClient({ songs, playlists }: PlaylistsClientProps) {
  const router = useRouter();
  const { t } = useLanguage();
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [localSearchValue, setLocalSearchValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [view, setView] = useState<'grid' | 'table'>('grid');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
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
    router.push(`/playlist/${playlist.id}`);
  };

  const handleStartSavedPlaylist = (e: React.MouseEvent, playlist: Playlist) => {
    e.stopPropagation();
    if (!playlist.songIds?.length) {
      router.push(`/playlist/${playlist.id}`);
      return;
    }
    const playlistSongs = (playlist.songIds as string[])
      .map((id) => songs.find((s) => s.id === id))
      .filter((s): s is Song => s !== undefined);
    if (playlistSongs.length === 0) {
      router.push(`/playlist/${playlist.id}`);
      return;
    }
    if (typeof window !== 'undefined') {
      const songList = playlistSongs.map((s) => s.id);
      const playlistContext = {
        isPlaylist: true,
        targetKey: '',
        songs: playlistSongs.map((s) => ({
          id: s.id,
          keyAdjustment: 0,
          originalKey: s.key || '',
          targetKey: s.key || '',
        })),
      };
      sessionStorage.setItem(
        'songNavigation',
        JSON.stringify({
          songList,
          currentIndex: 0,
          sourceUrl: '/playlists',
          playlistContext,
        })
      );
      sessionStorage.removeItem('hasUsedNext');
      router.push(`/song/${playlistSongs[0].id}`);
    }
  };

  const getSongCount = (p: Playlist) => (p as any).songCount ?? p.songIds?.length ?? 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6">
        {/* Search + Filter + Add - same row as folders */}
        <div className="mb-4 flex items-stretch gap-2">
          <div className="flex-1 min-w-0 relative">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={localSearchValue}
                onChange={(e) => setLocalSearchValue(e.target.value)}
                placeholder={t('playlistsPage.searchPlaceholder')}
                className="block w-full pl-12 pr-12 py-3 sm:py-4 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base text-gray-900 dark:text-gray-100"
              />
              {localSearchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 min-w-[44px] min-h-[44px] justify-center"
                  aria-label={t('common.clear')}
                >
                  <XMarkIcon className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
          <button
            onClick={() => setIsFilterSheetOpen(true)}
            className="shrink-0 p-3 min-h-[44px] min-w-[44px] rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            aria-label={t('playlistsPage.filters')}
          >
            <AdjustmentsHorizontalIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => router.push('/playlist')}
            className="shrink-0 p-3 min-h-[44px] min-w-[44px] rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center justify-center"
            aria-label={t('playlistsPage.newPlaylist')}
          >
            <PlusIcon className="h-5 w-5" />
          </button>
        </div>

        {/* View toggle - full width */}
        <div className="mb-4 w-full">
          <div className="flex w-full rounded-full bg-muted/80 dark:bg-gray-800 p-0.5 gap-0.5">
            <button
              type="button"
              onClick={() => setView('grid')}
              className={`flex-1 min-h-[40px] px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 ${
                view === 'grid'
                  ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={t('playlistsPage.gridView')}
            >
              <Squares2X2Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>{t('playlistsPage.gridView')}</span>
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`flex-1 min-h-[40px] px-4 py-2 text-sm font-medium rounded-full transition-all duration-200 flex items-center justify-center gap-1.5 ${
                view === 'table'
                  ? 'bg-background dark:bg-white/10 text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              title={t('playlistsPage.tableView')}
            >
              <TableCellsIcon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
              <span>{t('playlistsPage.tableView')}</span>
            </button>
          </div>
        </div>

        {/* Content */}
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
              onClick={() => router.push('/playlist')}
              className="mt-4 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium min-h-[44px]"
            >
              <SparklesIcon className="h-5 w-5" />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2">
            {sortedPlaylists.map((playlist) => (
              <PlaylistCard
                key={playlist.id}
                playlist={playlist}
                songCount={getSongCount(playlist)}
                onPlay={(e) => handleStartSavedPlaylist(e, playlist)}
                onOpen={() => handlePlaylistClick(playlist)}
              />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('playlistsPage.name')}
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                    {t('playlistsPage.description')}
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('playlistsPage.songCount')}
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                    {t('playlistsPage.createdAt')}
                  </th>
                  <th className="px-3 sm:px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t('common.play')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedPlaylists.map((playlist) => (
                  <tr
                    key={playlist.id}
                    onClick={() => handlePlaylistClick(playlist)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                  >
                    <td className="px-3 sm:px-4 py-3">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate max-w-[200px]">
                        {playlist.name}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 hidden sm:table-cell">
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate max-w-xs">
                        {playlist.description || '–'}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                        <MusicalNoteIcon className="h-4 w-4 flex-shrink-0" />
                        {getSongCount(playlist)}
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell">
                      {new Date(playlist.createdAt).toLocaleDateString(undefined, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => handleStartSavedPlaylist(e, playlist)}
                        aria-label={t('playlistsPage.playPlaylist')}
                        className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain space-y-4 pb-4 px-1">
            <div className="rounded-2xl bg-muted/50 dark:bg-muted/30 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
              <Label htmlFor="playlist-sort" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('playlistsPage.sortBy')}
              </Label>
              <Select value={sortField} onValueChange={(v) => setSortField(v as SortField)}>
                <SelectTrigger id="playlist-sort" className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">{t('playlistsPage.name')}</SelectItem>
                  <SelectItem value="songCount">{t('playlistsPage.songCount')}</SelectItem>
                  <SelectItem value="createdAt">{t('playlistsPage.createdAt')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="rounded-2xl bg-muted/50 dark:bg-muted/30 border border-black/[0.06] dark:border-white/[0.08] p-3.5">
              <Label htmlFor="playlist-sort-dir" className="text-[11px] font-medium text-muted-foreground mb-2.5 block">
                {t('songs.sortOrder')}
              </Label>
              <Select value={sortDirection} onValueChange={(v) => setSortDirection(v as SortDirection)}>
                <SelectTrigger id="playlist-sort-dir" className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">{t('songs.ascending')}</SelectItem>
                  <SelectItem value="desc">{t('songs.descending')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <SheetFooter className="shrink-0 flex flex-row gap-3 px-6 py-4 pt-4 pb-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-background safe-area-inset-bottom">
            <Button variant="outline" onClick={handleClearFilters} className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial">
              {t('common.clear')}
            </Button>
            <Button onClick={handleApplyFilters} className="flex-1 h-10 rounded-xl font-medium min-h-[44px] sm:flex-initial">
              {t('common.apply')}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  );
}
