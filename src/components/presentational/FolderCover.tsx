'use client'

import { FolderShape } from '@/components/presentational/FolderShape'
import { usePlaylistCover } from '@/lib/hooks/usePlaylistCover'
import { cn } from '@/lib/utils'

interface FolderCoverProps {
  imageUrl?: string | null
  /** Helps resolve curated covers by name when imageUrl is absent. */
  name?: string
  songCount?: number
  className?: string
  shapeClassName?: string
}

/** Cover image for a playlist (folder), with FolderShape fallback. */
export function FolderCover({
  imageUrl,
  name,
  songCount,
  className,
  shapeClassName,
}: FolderCoverProps) {
  const coverUrl = usePlaylistCover({ imageUrl, name })

  if (coverUrl) {
    return (
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-xl bg-muted',
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={coverUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return <FolderShape count={songCount} className={shapeClassName} />
}
