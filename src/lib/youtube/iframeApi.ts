'use client'

export type YTPlayerInstance = {
  seekTo: (seconds: number, allowSeekAhead: boolean) => void
  playVideo: () => void
  pauseVideo: () => void
  getCurrentTime: () => number
  getDuration: () => number
  getPlayerState: () => number
  destroy: () => void
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string
          width?: string | number
          height?: string | number
          playerVars?: Record<string, string | number>
          events?: {
            onReady?: (event: { target: YTPlayerInstance }) => void
            onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void
          }
        }
      ) => YTPlayerInstance
      PlayerState: {
        PLAYING: number
        PAUSED: number
        ENDED: number
      }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

export function loadYoutubeIframeApi(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve()
  if (window.YT?.Player) return Promise.resolve()

  return new Promise((resolve) => {
    const previous = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      previous?.()
      resolve()
    }

    if (!document.querySelector('script[data-yt-iframe-api]')) {
      const script = document.createElement('script')
      script.src = 'https://www.youtube.com/iframe_api'
      script.async = true
      script.dataset.ytIframeApi = 'true'
      document.body.appendChild(script)
    }
  })
}

export type YoutubePlayerHandle = {
  seekTo: (seconds: number) => void
  getCurrentTime: () => number
  getDuration: () => number
  play: () => void
  pause: () => void
  isReady: () => boolean
  getVideoId: () => string | null
}
