'use client'

import { FolderShape } from '@/components/presentational/FolderShape'
import { cn } from '@/lib/utils'

interface FolderCoverProps {
  imageUrl?: string | null
  songCount?: number
  className?: string
  shapeClassName?: string
}

/** Cover image for a playlist (folder), with FolderShape fallback. */
export function FolderCover({
  imageUrl,
  songCount,
  className,
  shapeClassName,
}: FolderCoverProps) {
  if (imageUrl) {
    return (
      <div
        className={cn(
          'relative aspect-square w-full overflow-hidden rounded-xl bg-muted',
          className
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          className="h-full w-full object-cover"
        />
      </div>
    )
  }

  return <FolderShape count={songCount} className={shapeClassName} />
}
