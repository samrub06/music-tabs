const PLAYLISTS_HUB_SEE_ALL_KEY = 'playlists-hub-see-all'

export function loadPlaylistsHubSeeAllPref(): boolean {
  if (typeof window === 'undefined') return false
  try {
    return localStorage.getItem(PLAYLISTS_HUB_SEE_ALL_KEY) === '1'
  } catch {
    return false
  }
}

export function savePlaylistsHubSeeAllPref(seeAll: boolean): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(PLAYLISTS_HUB_SEE_ALL_KEY, seeAll ? '1' : '0')
  } catch {
    // ignore quota / private mode
  }
}
